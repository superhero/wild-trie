import util from 'node:util'

export default class WildTrie
{
  static SEEN = Symbol('SEEN')
  static LEAF = Symbol('LEAF')

  /**
   * Creates a new `WildTrie` instance.
   * @param {*} [arg] - Optionally declares a structure from the provided value.
   */
  constructor(arg)
  {
    if(arg !== undefined)
    {
      return WildTrie.from(arg)
    }

    const config = 
    {
      wildcard : '*', 
      globstar : '**' 
    }

    Object.defineProperties(this, 
    {
      'branches' : { value: new Map() },
      'config'   : { value: config },
    })
  }

  /**
   * A factory method to create a `WildTrie` instance from the provided value.
   * @param {*} arg 
   * @returns {WildTrie} - Returns a new `WildTrie` instance.
   */
  static from(arg)
  {
    if(arg instanceof WildTrie)
    {
      return arg
    }

    const trie = new this()

    switch(Object.prototype.toString.call(arg))
    {
      case '[object Object]':
      case '[object Array]':
      {
        for(const branch in arg)
        {
          trie.branches.set(branch, this.from(arg[branch]))
        }

        break
      }
      default:
      {
        trie.define(arg)
      }
    }

    return trie
  }

  /**
   * Declares the defined path, if not already defined.
   * @param {*} [branch] 
   * @param {...*} [path] 
   * @returns {WildTrie}
   */
  declare(branch, ...path)
  {
    if(branch)
    {
      if(false === this.branches.has(branch))
      {
        this.branches.set(branch, new this.constructor())
      }

      return this.branches.get(branch).declare(...path)
    }
    else
    {
      return this
    }
  }

  /**
   * Defines a provided value associated to the trie node.
   * @param {*} value     - The value to define on "this" trie node.
   * @returns {WildTrie}  - Returns the trie node.
   */
  define(value)
  {
    this.value = value
    return this
  }

  /**
   * Deletes the specific branch of the trie path specified.
   * @param {...*} [path]
   * @returns {boolean} - Has mutatated
   */
  delete(...path)
  {
    return this.node(...path)?.branches.delete(branch) ?? false
  }

  /**
   * Checks if the specified path exists in the trie, returning true if it does, or false if it
   * doesn't.
   * @param {...*} [path]
   * @returns {boolean}
   */
  has(...path)
  {
    return this.leafs(...path).next().done === false
  }

  /**
   * Returns the specific trie node that matches the provided path or undefined if the path
   * doesn't have a specified trie node.
   * @param {*} [branch] 
   * @param {...*} [path]
   * @returns {WildTrie|undefined}
   */
  node(branch, ...path)
  {
    if(branch)
    {
      if(this.branches.has(branch))
      {
        const trie = this.branches.get(branch)
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
   * @param {*} branch        - The branch to reference.
   * @param {WildTrie} trie   - The trie instance to reference the branch to.
   * @returns {WildTrie}      - Returns the WildTrie instance.
   * @throws {TypeError}      - E_WILD_TRIE_REFERENCE_BRANCH    - If the branch is not defined.
   * @throws {TypeError}      - E_WILD_TRIE_REFERENCE_INSTANCE  - If the trie is not an instance of WildTrie.
   * @throws {ReferenceError} - E_WILD_TRIE_REFERENCE_CIRCULAR  - If the reference creates a circular path.
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

    for(const [ , decendent ] of trie.descendants())
    {
      if(decendent === this)
      {
        const error = new ReferenceError('Can not reference a trie if it creates a circular path')
        error.code  = 'E_WILD_TRIE_REFERENCE_CIRCULAR'
        error.cause = 'The targeted trie is a descendant to the referenced trie'
        throw error
      }
    }

    this.branches.set(branch, trie)

    return this
  }

  /**
   * Returns the size of the branches trie map.
   * @returns {number} - The number of branches in the trie.
   */
  get size()
  {
    return this.branches.size
  }

  /**
   * Returns a JSON representation of the trie structure, including all branches and all trie nodes.
   * @param {number} [depth=Infinity]                 - The depth to which the trie should be serialized.
   * @typedef {Object<*, WildTrieJSON>} WildTrieJSON  - Serialized representation of the WildTrie.
   * @returns {WildTrieJSON}
   */
  toJSON(depth = Infinity)
  {
    const
      json    = {},
      compose = --depth >= 0
        ? trie => this.branches.size ? trie.toJSON(depth) : trie.value
        : trie => `[${trie.constructor?.name ?? 'Object'}]`

    for(const [ branch, trie ] of this.branches)
    {
      json[branch] = compose(trie)
    }

    return json
  }

  /**
   * Returns a string representation of the trie structure.
   * @param {number} [depth=Infinity] - The depth to which the trie should be serialized.
   * @param {Function} [stylize]      - A function to stylize the output string.
   * @returns {string}                - A string representation of the trie structure.
   */
  toString(depth = Infinity, stylize)
  {
    let output = ''

    const entries = [ ...this.branches ]

    for(let i = 0; i < entries.length; i++)
    {
      const [ branch, trie ] = entries[i]
      const
        isLast    = i === entries.length - 1,
        prefix    = isLast ? '└─' : '├─',
        subTrie   = depth > 1 && trie.size > 0,
        tree      = subTrie
                  ? trie.toString(depth - 1, stylize) 
                  : trie.size ? '…' : '',
        mapper    = line => line 
                    ? (isLast || !subTrie 
                      ? ' ' : '│') + (subTrie 
                        ? '  ' : '') + line 
                    : '',
        indented  = tree.split('\n').map(mapper).join('\n'),
        value     = trie.value !== undefined 
                  ? ` : ${this.#stylize(trie.value, stylize)}` 
                  : ''

      output += `\n${prefix} ${this.#stylize(branch, stylize)}${value}${indented}`
    }

    return output
  }

  #stylize(input, stylize = s => s)
  {
    const type  = input === null 
                ? 'null' 
                : input instanceof Date 
                ? 'date' 
                : input instanceof RegExp 
                ? 'regexp' 
                : typeof input

    return stylize(input, type)
  }

  /**
   * Custom inspect method for the WildTrie class, allowing it to be inspected in a more readable
   * format when using `util.inspect`.
   * @param {number} [depth]            - The depth to which the trie should be serialized.
   * @param {Object} [options]          - Options for the inspect method.
   * @param {number} [options.compact]  - If true, the output will be more compact.
   * @returns {string}                  - A string representation of the trie structure.
   */
  [util.inspect.custom](depth, options) 
  {
    depth = depth ?? options?.compact

    const
      stylize     = options?.stylize ?? (str => str),
      serialized  = this.toString(depth, stylize),
      className   = stylize(this.config.name ?? this.name ?? this.constructor.name ?? 'WildTrie', 'special')

    return `${className} ${serialized}`
  }

  /**
   * Yields all descendant branches paired with their associated trie nodes.
   * 
   * Traverses the trie recursively, collecting every branch in the subtree rooted at the 
   * provided path.
   * 
   * @param {...*} [path] - An optional path to begin traversal from matching leaf nodes.
   * @yields {WildTrie}   - A descendant `WildTrie` node.
   */
  * descendants(...path)
  {
    const seen = new WeakSet()
    for(const trie of this.leafs(...path))
    {
      yield * this.#descendants(seen, trie)
    }
  }

  * #descendants(seen, upstreamTrie)
  {
    for(const downstreamTrie of upstreamTrie.branches.values())
    {
      if(false === seen.has(downstreamTrie))
      {
        seen.add(downstreamTrie)
        yield downstreamTrie
        yield * this.#descendants(seen, downstreamTrie)
      }
    }
  }

  /**
   * Returns a generator that yields all the leaf nodes of the trie that match the specified path.
   * 
   * If the provided path doesn't exist, then an empty iteratot will be returned.
   * 
   * If the path branch is specific, it will return the trie node that match that branch.
   * 
   * If a path branch is defined using a @see config.wildcard, it will return all trie nodes of all
   * the defined branches of the trie. 
   * 
   * If a path branch is defined using a @see config.globstar, it will return all the
   * descendants of the trie, including all trie nodes of all the defined branches of the trie.
   * 
   * @param {*} [branch]
   * @param {...*} [path]
   * @yields {WildTrie} - Each yielded value is a unique leaf node.
   */
  * leafs(...path)
  {
    for(const [ trie, state ] of this.walk(...path))
    {
      if(WildTrie.LEAF === state)
      {
        yield trie
      }
    }
  }

  /**
   * Yields all the defined values at the specified path. Undefined values are not yielded.
   * @param {...*} [path]
   * @yields {*} - Each yielded value is the defined value in the nodes of the specified path.
   */
  * leafValues(...path)
  {
    for(const trie of this.leafs(...path))
    {
      if(trie.value !== undefined)
      {
        yield trie.value
      }
    }
  }

  /** 
   * Returns a generator that yields a trail of leaf nodes from the matched leaf nodes of the trie
   * back to the root node where the path was traversed from.
   * 
   * This method is useful for tracing each node in the path that leads to a matching leaf node.
   * 
   * @param {...*} [path] - The path to traverse in the trie.
   * @yields {WildTrie}   - Each yielded value is a unique node that is, or ancestor of, a leaf node.
   */
  * trail(...path)
  {
    const trail = new WeakSet()

    for(const [ trie, state ] of this.walk(...path))
    {
      if(WildTrie.LEAF === state)
      {
        trail.add(trie)
        yield trie
      }
      else
      {
        for(const branchTrie in trie.branches.values())
        {
          if(trail.has(branchTrie))
          {
            trail.add(trie)
            yield trie
            break
          }
        }
      }
    }
  }

  /**
   * Yields all the defined values from the trail nodes of the provided node. 
   * Undefined values are not yielded.
   * @param {...*} [path]
   * @yields {*} - Each yielded value is the defined value in the nodes of the specified path.
   */
  * trailValues(...path)
  {
    for(const trie of this.trail(...path))
    {
      if(trie.value !== undefined)
      {
        yield trie.value
      }
    }
  }

  /**
   * Traverses the trie structure and yields all visited nodes.
   * @param {*} branch 
   * @param  {...*} path 
   * @yields {[WildTrie, Symbol]} - Each yielded value is a tuple of the trie node and its state.
   */
  * walk(branch, ...path)
  {
    if(branch)
    {
      const seen = new WeakSet([ this ])

      for(const [ trie, state ] of this.#walk(seen, branch, ...path))
      {
        seen.add(trie)
        yield [ trie, state ]
      }

      yield [this, WildTrie.SEEN]
    }
    else
    {
      yield [this, WildTrie.LEAF]
    }
  }

  * #walk(seen, branch, ...path)
  {
    if(this.config.wildcard === branch)
    {
      yield * this.#walkWildcardPath(seen, branch, ...path)
    }
    else if(this.config.globstar === branch)
    {
      yield * this.#walkGlobstarPath(seen, branch, ...path)
    }
    // If the branch-path is not a wildcard or globstar
    // ... then walk the specific node-branch.
    else
    {
      yield * this.#walkWildcardNodeBranch(seen, branch, ...path)
      yield * this.#walkGlobstarNodeBranch(seen, branch, ...path)
      yield * this.#walkMatchingNodeBranch(seen, branch, ...path)
    }
  }

  * #walkWildcardPath(seen, _, ...path)
  {
    for(const trie of this.branches.values())
    {
      if(false === seen.has(trie))
      {
        yield * trie.walk(...path)
      }
    }
  }

  * #walkGlobstarPath(seen, _, ...path)
  {
    yield * this.walk(...path)

    for(const trie of this.descendants())
    {
      if(false === seen.has(trie))
      {
        yield * trie.walk(...path)
      }
    }
  }

  * #walkWildcardNodeBranch(seen, _, ...path)
  {
    if(this.branches.has(this.config.wildcard))
    {
      const trie = this.branches.get(this.config.wildcard)
      if(false === seen.has(trie))
      {
        yield * trie.walk(...path)
      }
    }
  }

  * #walkGlobstarNodeBranch(seen, branch, ...path)
  {
    if(this.branches.has(this.config.globstar))
    {
      const globstarTrie = this.branches.get(this.config.globstar)

      // If the globstar wildcard node-branch has no path
      // ... it means it should match all descendants.
      if(globstarTrie.size === 0)
      {
        if(false === seen.has(globstarTrie))
        {
          yield [globstarTrie, WildTrie.LEAF]
        }
      }

      // If a globstar wildcard has been added to a trie
      // ... it means to walk all descendants, and all sibling descendants.
      for(const trie of this.descendants())
      {
        if(false === seen.has(trie))
        {
          for(const tail = [ branch, ...path ]; tail.length; tail.shift())
          {
            yield * trie.walk(...tail)
          }
        }
      }
    }
  }

  * #walkMatchingNodeBranch(seen, branch, ...path)
  {
    if(this.branches.has(branch))
    {
      const trie = this.branches.get(branch)
      if(false === seen.has(trie))
      {
        yield * trie.walk(...path)
      }
    }
  }
}
