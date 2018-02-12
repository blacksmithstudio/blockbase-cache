const Redis = require('ioredis')

/**
 * Blockbase Cache driver (app.drivers.cache)
 * @memberof app.drivers
 * @author Sebastien Hideux <seb@blacksmith.studio>
 * @param {Object} app - Application namespace
 *
 * @returns {Object} driver object containing public methods
 */
module.exports = function (app) {
    const redis = new Redis(app.config.redis)

    function _format(value) {
        if (value && typeof value == 'object' && !Array.isArray(value)) {
            console.error('Cache Format | cannot format object ', value)
            throw Error('Cache Format | cannot format object !')
        }

        if (Array.isArray(value))
            return value.reduce((sum, v) => sum + '-' + v, 'array:')
        else
            return value && value.toString().replace(/([\W]+)/, '').toLowerCase()

    }

    /**
     * Class used for caching
     * @namespace app.drivers.cache
     * @param {string} moduleCacheKey - The parent's module cache key to use
     * @param {number} cacheExpire - values default expiration time (seconds)
     * @returns {{class: Cache}}
     */
    return class Cache {

        /**
         * Constructor
         * @param moduleCacheKey
         * @param cacheExpire - seconds
         */
        constructor(moduleCacheKey, cacheExpire) {
            this._moduleCacheKey = moduleCacheKey
            this._cacheExpire = cacheExpire
            this._disabled = !!app.config.cache.disabled
        }

        //Methods

        /**
         * Set
         * @param {string}  cacheKey - the cache key
         * @param {object=}  params - parameters (cache key varies on params values)
         * @param {object}  value - the value to store
         * @returns {string}
         */
        async set(cacheKey, params, value) {
            if (this._disabled) return null
            if (params && typeof params != 'object')
                throw Error('Cache Set | invalid type for object params')
            // console.log('SET params', params)

            let formattedKey = 'default';
            if (params) {
                if (Array.isArray(params))
                    formattedKey = params.reduce((sum, v) => sum + '.' + v, 'array:')
                else {

                    let keys = Object.keys(params).filter(k => params.hasOwnProperty(k))
                    formattedKey = keys.reduce((sum, p) => '' + params[p] ? sum + '.' + `${p}:${_format(params[p])}` : sum + `.${p}.`, `${cacheKey}`);
                }
            }

            // console.log('formattedKey', formattedKey)
            try {
                let res = await redis.hset(this._moduleCacheKey, formattedKey, JSON.stringify(value)) //seconds
                await redis.expire(this._moduleCacheKey, this._cacheExpire)

                return res
            }
            catch (e) {
                console.error(`Cache ${this._moduleCacheKey} SET error`, e)
                throw e
            }
        }

        /**
         * Get
         * @param {string}  cacheKey
         * @param {object}  params - parameters (cache key varies on params values)
         * @returns {Promise<*>}
         */
        async get(cacheKey, params) {
            if (this._disabled) return null
            if (params && typeof params != 'object')
                throw Error('Cache Get | invalid type for object params')
            if (!params) return null
            // console.log('GET params', params)

            let formattedKey = 'default';
            if (params) {
                if (Array.isArray(params))
                    formattedKey = params.reduce((sum, v) => sum + '.' + v, 'array:')
                else {

                    let keys = Object.keys(params).filter(k => params.hasOwnProperty(k))
                    formattedKey = keys.reduce((sum, p) => '' + params[p] ? sum + '.' + `${p}:${_format(params[p])}` : sum + `.${p}.`, `${cacheKey}`);
                }
            }

            try {
                let cached = await redis.hget(this._moduleCacheKey, formattedKey)
                if (cached)
                    return JSON.parse(cached)
                return null
            }
            catch (e) {
                redis.del(this._moduleCacheKey)
                console.error(`Cache ${this._moduleCacheKey} GET error`, e)
                throw e
            }
        }

        async clear(cacheKey) {
            if (this._disabled) return null
            try {
                if (cacheKey) {
                    let keys = await redis.hgetall(this._moduleCacheKey)
                    keys = Object.keys(keys)
                    let res = []
                    for (let k of keys) {
                        if (k.startsWith(cacheKey))
                            res.push(await redis.hdel(this._moduleCacheKey, k))
                        // console.log('clearing k', k)
                    }
                    // console.log('result : ', res)
                    return res
                }
                return await redis.del(this._moduleCacheKey)
            }
            catch (e) {
                console.error(`Cache ${this._moduleCacheKey}/${cacheKey} DEL error`, e)
                throw e
            }

        }
    }
}