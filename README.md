# Driver Cache for Blockbase
Compatible with Blockbase Framework

### Version
0.1.1

######TODO : 
- add debug configuration option

### How to install ?
```shell
$ npm i --save blockbase-cache
```

Then add to your `config/{env}.yml` the following (example) instructions depending of your system
```yaml

#optional
redis:  
    port: 
    host:

#required 
cache: 
    disabled: false
```
####Don't want to read ?
*->* Jump to the **./sample.js** sample

### Cache logic

Redis allows us to store a lot of different types of data.

In our case we use the hashset datatype that is ideal to store data according to :
 - a static default key that never changes : the **moduleKey**
 - a cache key/value pair that can vary, depending on parameter key/values: the **cacheKey**
 
 ##### Features
 - The driver allows you to store data simply with a key, or also with varying parameters
 - You can then clear data according to the **modulekey** or the **cachekey**
 - Every value expires according to the default Module expire time 

### Instanciation
The driver is a Cache class to connects to your redis server to store data.
It can be instanciated using the following parameters, us : 

```js

    let moduleCacheKey = 'models.user'
    let cacheExpire = 60 // seconds
    const cache = new Cache(moduleCacheKey, cacheExpire) 
```

 ##### Defaut usage
 
 The static **moduleKey** allows to store sub-values according to a key that should never change. 
 - Example : *models.user* 
 
 The **cacheKey** can be, for example, the name of the **function** that has data to cache :
 - Example key : *user.list*
 - Example value : *[]*
 
 ```js
    await app.drivers.cache.set('user.list', opt, userList)
 ```
 
 This way, when you call your function **user.list** without _varying parameters_, 
 the Cache driver will create a **hashset** with the key *models.user*, and with a **field** *user.list* 
 that will store your data as the **value** :
 
 A json comparison of the data stored in the cache would give this : 
 ```json
    {
      "models.user": {
        "user.list": [],
        "user.listByID": [],
        "user.listByName": []
      }
    }
 ``` 
 
 
 #####**Varying parameters** :
 
 These are used when you want to store/retrieve data according to parameter that can change.
 
 For example, a **user.list** function that is called with a limit of 50 results, or 100 results, 
 should not send back the same user list. 
 
 The cache driver automatically handles this, so you only have to give the parameters that can change : 
 
 ```js
    let opt = {limit: 100, offset:0}
    //retrieve your userlist...
    await app.drivers.cache.set('user.list', opt, userList)
 ```

Here the cache driver will generate a **field** name according to your parameters, which gives us for example :

 A json comparison of the data stored in the cache would give this : 
 ```json
    {
      "models.user": {
        "user.list.limit:100.offset:0": [],
        "user.list.limit:100.offset:50": [],
        "user.listByID": [],
        "user.listByName": []
      }
    }
 ``` 
So the driver will give you back the correct data depending on your input parameters


### Usage

#####1) Set

Store a value in cache according to 3 params : 
- Cache key : for ex your function name
- Varying params (optional) 
- The value (required)

For now params can be a an object with one level of keys/values, or can also be an Array

```js
    await app.drivers.cache.set('user.list', null, userList)
    
    //Or with varying params :
    let opt = {limit: 100, offset: 0}
    let opt = [100, 0]
    
    /*let opt = {limit: 100, offset: {from:0}}*/ //Sub objects not supported yet
    
    await app.drivers.cache.set('user.list', opt, userList)
```

#####2) Get

Retrieve a value from cache :

```js
    await app.drivers.cache.get('user.list')
    
    //Or with varying params :
    let opt = {limit: 100, offset: 0} || null
    await app.drivers.cache.get('user.list', opt) 
```

#####3) Clear

To clear a cache key, or fully clear the module's cache :

```js
    //To clear a cacheKey's values (even with those with varying params) 
    await app.drivers.cache.clear('user.list')
    
    //To clear all the module's keys :
    await app.drivers.cache.clear()
```

Be also careful `redis` is mandatory when you use the cache...

License
----
(Licence [MIT](https://github.com/blacksmithstudio/blockbase-express/blob/master/LICENCE))
Coded by [Blacksmith](https://www.blacksmith.studio)


**Free Software, Hell Yeah!**

[Node.js]:https://nodejs.org/en
[NPM]:https://www.npmjs.com
