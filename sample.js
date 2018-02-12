//This is a sample for demo usage


const Cache = require('./driver')

let moduleKey = 'model.test'
let cache = new Cache(moduleKey, 10)


let cacheKey = 'getvalues'

async function getValues(filter) {
    let values = [{id: 1}, {id: 2}] //yes we got those from DB according to the filter
    try {

        let cached = await cache.get(cacheKey, filter)
        if (cached)
            return cached

        await cache.set(cacheKey, filter, values)
        return values
    }
    catch (e) {
        throw e
    }
}


//Set values in cache with a default key
(async () => await getValues(null))()

//Set values in cache with a default key and varying params
let filter = {id: 1}
(async () => await getValues(filter))()

//get the values from the cache, less than 10 seconds before they expire:
(async () => await getValues(null))()

//clear the cache key values
(async () => await cache.clear(cacheKey))()

//Clear all the cache module's values :
(async () => await cache.clear())()