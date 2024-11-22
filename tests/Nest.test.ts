import { describe, it } from 'mocha';
import { expect } from 'chai';
import Nest from '../src/Nest';

const body = `--BOUNDARY\r
Content-Disposition: form-data; name="foo"\r
bar\r
--BOUNDARY\r
Content-Disposition: form-data; name="bar"\r
zoo
--BOUNDARY--`

describe('Hash Store Tests', () => {
  it('Should CRUD', async () => {
    let store = new Nest;
    store.set('foo', 'bar', 'zoo');
    store.set('foo', 'zoo', ['foo', 'bar', 'zoo']);

    type Foo = {
      foo: {
        bar: string;
        zoo: string[];
      }
    };

    expect(store.has('foo', 'bar')).to.equal(true);
    expect(store.has('bar', 'foo')).to.equal(false);
    expect(store.get<string>('foo', 'zoo', 1)).to.equal('bar');
    expect(store.get<Foo>().foo.zoo[0]).to.equal('foo');

    store.delete('foo', 'bar');
    expect(store.has('foo', 'bar')).to.equal(false);
    expect(store.has('foo', 'zoo')).to.equal(true);

    //foo=bar&zoo[]=1&zoo[]=2&zoo[]=3&product[title]=test
    //&product[price]=1000&product[rating][]=1&product[rating][]=2
    //&product[rating][]=3&product[abstract][][name]=john
    //&product[abstract][][name]=james&boom[]=1
    store = new Nest;
    store.set('foo', 'bar');
    store.set('zoo', '', 1);
    store.set('zoo', '', 2);
    store.set('zoo', '', 3);
    store.set('product', 'title', 'test');
    store.set('product', 'price', 1000);
    store.set('product', 'rating', '', 1);
    store.set('product', 'rating', '', 2);
    store.set('product', 'rating', '', 3);
    store.set('product', 'abstract', '', 'name', 'john');
    store.set('product', 'abstract', '', 'name', 'james');
    store.set('boom', '', 1);

    const expected = '{"foo":"bar","zoo":[1,2,3],"product":{"title":"test",'
      + '"price":1000,"rating":[1,2,3],"abstract":[{"name":"john"},'
      + '{"name":"james"}]},"boom":[1]}';

    const actual = JSON.stringify(store.get());

    expect(actual).to.equal(expected);
  });

  it('Should path', async () => {
    let store = new Nest;
    store.withPath.set('foo.bar', 'zoo');
    store.withPath.set('foo.zoo', ['foo', 'bar', 'zoo']);

    expect(store.withPath.has('foo.bar')).to.equal(true);
    expect(store.withPath.has('bar.foo')).to.equal(false);
    expect(store.withPath.get<string>('foo.zoo.1')).to.equal('bar');

    store.withPath.delete('foo.bar');
    expect(store.withPath.has('foo.bar')).to.equal(false);
    expect(store.withPath.has('foo.zoo')).to.equal(true);

    store.withPath.forEach('foo.zoo', (value, index) => {
      expect(value).to.equal(['foo', 'bar', 'zoo'][index]);
    });
  });

  it('Should set with query string', async () => {
    let store = new Nest;
    store.withQuery.set('zoo=bar&foo[zoo][0]=foo&foo[zoo][1]=bar&foo[zoo][2]=john+doe');

    expect(store.has('zoo')).to.equal(true);
    expect(store.get('foo', 'zoo', 1)).to.equal('bar');
    expect(store.get<string>('foo', 'zoo', 2)).to.equal('john doe');

    store = new Nest;
    store.withQuery.set('filter%5Btype%5D=user&span%5Bcreated%5D%5B0%5D=2024-10-29T13%3A27%3A54.431&span%5Bcreated%5D%5B1%5D=2024-10-29T13%3A27%3A54.431&span%5Bupdated%5D%5B0%5D=2024-10-29T13%3A27%3A54.432&span%5Bupdated%5D%5B1%5D=2024-10-29T13%3A27%3A54.432');
    expect(store.get('span', 'created', 0)).to.equal('2024-10-29T13:27:54.431');
    expect(store.get('span', 'created', 1)).to.equal('2024-10-29T13:27:54.431');
    expect(store.get('span', 'updated', 0)).to.equal('2024-10-29T13:27:54.432');
    expect(store.get('span', 'updated', 1)).to.equal('2024-10-29T13:27:54.432');

    store = new Nest;
    store.withQuery.set('filter%5Btype%5D=&span%5Bcreated%5D%5B0%5D=&span%5Bcreated%5D%5B1%5D=&span%5Bupdated%5D%5B0%5D=&span%5Bupdated%5D%5B1%5D=');
    expect(store.get('filter', 'type')).to.equal('');
    expect(store.get('span', 'created', 0)).to.equal('');
    expect(store.get('span', 'created', 1)).to.equal('');
    expect(store.get('span', 'updated', 0)).to.equal('');
    expect(store.get('span', 'updated', 1)).to.equal('');

    store = new Nest;
    store.withQuery.set('tags%5B%5D=foo&tags%5B%5D=bar&filter%5Btype%5D%5B%5D=john+doe');
    expect(store.get('tags', 0)).to.equal('foo');
    expect(store.get('tags', 1)).to.equal('bar');
    expect(store.get('filter', 'type', 0)).to.equal('john doe');
  });

  it('Should set with form data', async () => {
    let store = new Nest;
    store.withFormData.set(body);

    expect(store.has('foo')).to.equal(true);
    expect(store.get('bar')).to.equal('zoo');
  });

  it('Should use type map', async () => {
    let store = new Nest<{
      foo: {
        bar: string;
        zoo: string[];
      };
      product: {
        title: string;
        price: number;
        rating: number[];
        abstract: { name: string }[];
      };
      boom: number[];
    }>;
    store.set('foo', 'bar', 'zoo');
    store.set('foo', 'zoo', ['foo', 'bar', 'zoo']);
    expect(store.get().foo.zoo[0]).to.equal('foo');
  });

  //<!------------- NEW TESTS ------------------------------->
  it('Should clear all data', async () => {
    let store = new Nest;
    store.set('foo', 'bar');
    store.set('baz', 'qux');
    expect(store.has('foo')).to.equal(true);
    expect(store.has('baz')).to.equal(true);
    store.clear();
    expect(store.has('foo')).to.equal(false);
    expect(store.has('baz')).to.equal(false);
  });


  it('Should set deeply nested data', async () => {
    let store = new Nest;
    store.set('user', 'address', 'city', 'New York');
    store.set('user', 'address', 'zipcode', '10001');
    expect(store.get('user', 'address', 'city')).to.equal('New York');
    expect(store.get('user', 'address', 'zipcode')).to.equal('10001');
  });


  it('Should delete from nested data', async () => {
    let store = new Nest;
    store.set('user', 'address', 'city', 'New York');
    store.set('user', 'address', 'zipcode', '10001');
    store.delete('user', 'address', 'zipcode');
    expect(store.has('user', 'address', 'zipcode')).to.equal(false);
    expect(store.get('user', 'address', 'city')).to.equal('New York');
  });


  it('Should not set an empty object', async () => {
    let store = new Nest;
    store.set('empty', {});
    expect(store.get('empty')).to.deep.equal({});
  });

  it('Should throw error on invalid data', async () => {
    let store = new Nest;
    try {
      store.data = {} as any;
    } catch (error) {
      expect(error).to.exist;
      expect(error.message).to.equal('Argument 1 expected Object');
    }
  });

  it('Should handle non-object data', async () => {
    let store = new Nest;
    store.set('user', 'name', 'John Doe');
    store.set('user', 'age', 30);
    expect(store.get('user', 'name')).to.equal('John Doe');
    expect(store.get('user', 'age')).to.equal(30);
  });





});