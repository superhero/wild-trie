import util from 'node:util'

export default class WildTrie
{
  #branches = new Map
  #config   = 
  {
    wildcard : '*', 
    globstar : '**' 
  }

  /**
   * Assign custom configurations to the WildTrie instance.
   * 
   * @param {Object} [config] Configurations for the WildTrie.
   * @param {*} [config.wildcard = '*'] Wildcard that match any branch.
   * @param {*} [config.globstar = '**'] Wildcard that match any descendant branch.
   */
  constructor(config)
  {
    if(config)
    {
      this.config = config
    }
  }

  /**
   * Returns the defined branches of the trie.
   * 
   * @returns {Object<*, WildTrie>}
   */
  get branches()
  {
    return Object.fromEntries([ ...this.#branches.entries() ])
  }

  /**
   * Setter for the private instance configurations.
   * This allows to set the configuration of the instance by assigning the values of the 
   * argument to the already defined default configurations.
   * Assigning the provided config arguemnt to the instance config prevents the user from
   * accidentally overwriting the required config keys.
   * 
   * @param {Object} config - The configuration object to assign.
   * 
   * @returns {Object} The configurations object of the instance.
   * 
   * @throws {TypeError} If the provided config is not an object.
   */
  set config(config)
  {
    const configType = Object.prototype.toString.call(config)

    if('[object Object]' !== configType)
    {
      const error = new TypeError(`The config must be an [object Object], got ${configType}`)
      error.code  = 'E_WILD_TRIE_CONFIG'
      throw error
    }

    // Assign the provided argument config to the instance config.
    Object.assign(this.#config, config)
  }

  /**
   * Getter for the private configurations.
   * 
   * @returns {Object} The configurations object of the instance.
   */
  get config()
  {
    return this.#config
  }

  /**
   * Declares the defined path, if not already defined.
   * 
   * @param {*} [branch] 
   * @param  {...*} [path] 
   * 
   * @returns {WildTrie}
   */
  declare(branch, ...path)
  {
    if(branch)
    {
      if(false === this.#branches.has(branch))
      {
        this.#branches.set(branch, new this.constructor(this.config))
      }

      return this.#branches.get(branch).declare(...path)
    }
    else
    {
      return this
    }
  }

  /**
   * Defines a provided value associated to the trie node.
   * 
   * @param {*} value The value to define on "this" trie node.
   * 
   * @returns {WildTrie} Returns the trie node.
   */
  define(value)
  {
    this.value = value
    return this
  }

  /**
   * Deletes the specific branch of the trie path specified.
   * 
   * @param  {...*} [path]
   * 
   * @returns {boolean} Mutatated
   */
  delete(...path)
  {
    const branch = path.pop()
    return path.length
    ? this.node(...path)?.delete(branch) ?? false
    : this.#branches.delete(branch)
  }

  /**
   * Returns a tuplet collection of all the descendant branches paired with their linked sub-tries.
   * Returns a flat entries collection of all the recursive branches and their sub-tries.
   * 
   * @param  {...any} [path] 
   * 
   * @returns {Array<[*, WildTrie]>}
   */
  descendants(...path)
  {
    const tries = this.traverse(...path)
    return [ ...this.#descendants(...tries) ]
  }

  * #descendants(...tries)
  {
    const entries = tries.flatMap(trie => Object.entries(trie.branches))

    for(const [ branch, trie ] of entries)
    {
      yield [ branch, trie ]
      yield * this.#descendants(trie)
    }
  }

  /**
   * Returns a filtered list of the defined values at the specified path.
   * If the path doesn't exist, or the path exists - but has no value, then an empty array will be 
   * returned.
   * 
   * @param  {...*} [path]
   * 
   * @returns {Array<[*]>}
   */
  get(...path)
  {
    return this.traverse(...path).map(trie => trie.value).filter(value => value !== undefined)
  }

  /**
   * Checks if the specified path exists in the trie, returning true if it does, or false if it
   * doesn't.
   * 
   * @param  {...*} [path]
   * 
   * @returns {boolean}
   */
  has(...path)
  {
    return this.traverse(...path).length > 0
  }

  /**
   * Returns the specific sub-trie node that matches the provided path or undefined if the path
   * doesn't have a specified sub-trie.
   * 
   * @param {*} [branch] 
   * @param  {...*} [path]
   * 
   * @returns {WildTrie|undefined}
   */
  node(branch, ...path)
  {
    if(branch)
    {
      if(this.#branches.has(branch))
      {
        const trie = this.#branches.get(branch)
        return trie.node(...path)
      }
    }
    else
    {
      return this
    }
  }

  /**
   * References a branch to a specific trie instance.
   * 
   * @param {*} branch The branch to reference.
   * @param {WildTrie} trie The trie instance to reference the branch to.
   * 
   * @throws {TypeError} - E_WILD_TRIE_REFERENCE_BRANCH - If the branch is not defined.
   * @throws {TypeError} - E_WILD_TRIE_REFERENCE_INSTANCE - If the trie is not an instance of WildTrie.
   * @throws {ReferenceError} - E_WILD_TRIE_REFERENCE_CIRCULAR - If the reference creates a circular path.
   * 
   * @returns {WildTrie} Returns the WildTrie instance.
   * 
   * @example
   * const trie = new WildTrie()
   * const anotherTrie = trie.declare('anotherTrie')
   * trie.reference('referencedTrie', anotherTrie)
   * trie.has('anotherTrie')     // true
   * trie.has('referencedTrie')  // true
   * trie.node('anotherTrie') === trie.node('referencedTrie')
   */
  reference(branch, trie)
  {
    if(undefined === branch)
    {
      const error = new TypeError('The branch must be defined when referencing a trie')
      error.code  = 'E_WILD_TRIE_REFERENCE_BRANCH'
      throw error
    }

    if(false === trie instanceof this.constructor)
    {
      const error = new TypeError(`The referenced trie must be an instance of ${this.constructor.name}`)
      error.code  = 'E_WILD_TRIE_REFERENCE_INSTANCE'
      throw error
    }

    const
      descendants = trie.descendants(),
      entries     = Object.entries(descendants),
      circular    = entries.some(([ , decendent ]) => decendent === this)

    if(circular)
    {
      const error = new ReferenceError('Can not reference a trie if it creates a circular path')
      error.code  = 'E_WILD_TRIE_REFERENCE_CIRCULAR'
      error.cause = 'The targeted trie is a descendant to the referenced trie'
      throw error
    }

    this.#branches.set(branch, trie)

    return this
  }

  /**
   * Returns the size of the branches trie map.
   * @returns {number}
   */
  get size()
  {
    return this.#branches.size
  }

  /**
   * Returns a JSON representation of the trie structure, including all branches and their
   * sub-tries.
   * 
   * @param {number} [depth=Infinity] The depth to which the trie should be serialized.
   * 
   * @typedef {Object} WildTrieJSON Serialized representation of the WildTrie.
   * @property {Object<*, WildTrieJSON>} branches - The branches of the trie.
   * @property {*} [value] - The value, if defined.
   * 
   * @returns {WildTrieJSON}
   */
  toJSON(depth = Infinity)
  {
    depth = Number(depth)

    const
      entries       = depth > 0 ? Object.entries(this.branches) : [],
      mapper        = trie => depth > 0 ? trie.toJSON(depth - 1) : Object.prototype.toString.call(trie),
      mappedEntries = entries.map(([ branch, trie ]) => [ branch, mapper(trie) ]),
      branches      = Object.fromEntries(mappedEntries),
      json          = entries.length ? { branches } : {}

    if(this.value !== undefined)
    {
      json.value = this.value
    }

    return json
  }

  /**
   * Returns a string representation of the trie structure in JSON format.
   * @param {number} [depth=1] The depth to which the trie should be serialized.
   * @returns {string} A string representation of the trie structure in JSON format.
   */
  toString(depth = 1)
  {
    return JSON.stringify(this.toJSON(depth), null, 2)
  }

  /**
   * Custom inspect method for the WildTrie class, allowing it to be inspected in a more readable
   * format when using `util.inspect`.
   * 
   * @param {number} [depth=Infinity] The depth to which the trie should be serialized.
   * @param {Object} [options] Options for the inspect method.
   * @param {number} [options.compact] If true, the output will be more compact.
   * 
   * @returns {string} A string representation of the trie structure.
   */
  [util.inspect.custom](depth, options) 
  {
    depth = Number(depth ?? options.compact) || Infinity

    const
      stylize     = options.stylize ?? (str => str),
      className   = stylize(this.constructor.name, 'name'),
      indentation = 2,
      json        = this.toJSON(depth),
      stringified = JSON.stringify(json, null, indentation)

    return `${className} ${stringified}`
  }

  /**
   * Traverses the trie structure and returns all sub-tries that match the specified path. 
   * 
   * If the provided path doesn't exist, then an empty array will be returned.
   * 
   * If the path branch is specific, it will return the sub-trie that match that branch.
   * 
   * If a path branch is defined using a @see config.wildcard, it will return all sub-tries of all
   * the defined branches of the trie. 
   * 
   * If a path branch is defined using a @see config.globstar, it will return all the
   * descendants of the trie, including all sub-tries of all the defined branches of the trie.
   * 
   * @param {*} [branch] 
   * @param {...*} [path] 
   * 
   * @returns {Array<[WildTrie]>}
   */
  traverse(branch, ...path)
  {
    if(branch)
    {
      const tries = []

      if(branch === this.config.wildcard)
      {
        for(const trie of this.#branches.values())
        {
          tries.push(...trie.traverse(...path))
        }
      }
      else if(branch === this.config.globstar)
      {
        for(const [ , trie ] of this.descendants().concat([[ branch, this ]]))
        {
          tries.push(...trie.traverse(...path))
        }
      }
      else
      {
        if(this.#branches.has(this.config.wildcard))
        {
          const trie = this.#branches.get(this.config.wildcard)
          tries.push(...trie.traverse(...path))
        }

        if(this.#branches.has(this.config.globstar))
        {
          const trie = this.#branches.get(this.config.globstar)

          if(trie.size === 0)
          {
            // If the globstar wildcard branch has no path, it means it should match all descendants.
            tries.push(trie)
          }

          for(const [ , trie ] of this.descendants())
          {
            tries.push(...[ branch, ...path ].flatMap((_, i, p) => trie.traverse(...p.slice(i))))
          }
        }
  
        if(this.#branches.has(branch))
        {
          const trie = this.#branches.get(branch)
          tries.push(...trie.traverse(...path))
        }
      }

      return tries
    }
    else
    {
      return [ this ]
    }
  }
}
