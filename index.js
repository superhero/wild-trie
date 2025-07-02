import util from 'node:util'

export default class WildTrie
{
  static SEEN = Symbol('SEEN')
  static LEAF = Symbol('LEAF')

  #branches = new Map()

  /**
   * Creates a new `WildTrie` instance.
   * @param {*} [arg] - Optionally defines a structure from the provided argument.
   */
  constructor(arg)
  {
    if(arg !== undefined)
    {
      return WildTrie.from(arg)
    }

    Object.defineProperty(this, 'config',
    {
      value:
      {
        wildcard : '*',
        globstar : '**'
      }
    })
  }

  /**
   * A factory method to create a `WildTrie` instance from the provided argument.
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
          trie.set(branch, this.from(arg[branch]))
        }

        break
      }
      default:
      {
        trie.state = arg
      }
    }

    return trie
  }

  /**
   * Clears all descendant branches at the provided branch-path.
   * @param {...*} [path]
   * @returns {WildTrie|undefined} - Returns the `WildTrie` instance that was cleared of descendant branches.
   */
  clear(...path)
  {
    if(path.length)
    {
      return this.get(...path)?.clear()
    }
    else
    {
      this.#branches.clear()
      return this
    }
  }

  /**
   * Declares the defined path, if not already defined.
   * @param {*} [branch] 
   * @param {...*} [path] 
   * @returns {WildTrie}
   */
  add(branch, ...path)
  {
    if(branch)
    {
      if(false === this.#branches.has(branch))
      {
        this.#branches.set(branch, new this.constructor())
      }

      return this.#branches.get(branch).add(...path)
    }
    else
    {
      return this
    }
  }

  /**
   * Deletes the specific branch of the branch-path specified.
   * @param {...*} path - requires at least one path segment.
   * @returns {boolean} - If the path exists and was deleted.
   */
  delete(...path)
  {
    if(path.length)
    {
      const branch = path.pop()

      if(path.length)
      {
        return this.get(...path)?.delete(branch) ?? false
      }
      else
      {
        return this.#branches.delete(branch)
      }
    }
    else
    {
      return false
    }
  }

  /**
   * Returns an iterable of all branches in the trie, including their associated `WildTrie` instances.
   * If a path is provided, it will return the entries of the specified branch trie.
   * Fallback to an empty iterable if the path is not declared.
   * @param {...*} [path] - The path to retrieve the entries from.
   * @returns {IterableIterator<[*, WildTrie]>} - An iterable of all direct branch entries.
   */
  entries(...path)
  {
    if(path.length)
    {
      return this.get(...path)?.entries() ?? Iterable.from([])
    }
    else
    {
      return this.#branches.entries()
    }
  }

  /**
   * Returns the specific trie-node that matches the provided path or undefined if the path
   * doesn't have a specified trie-node.
   * @param {...*} [path]
   * @returns {WildTrie|undefined}
   */
  get(branch, ...path)
  {
    if(branch)
    {
      if(this.#branches.has(branch))
      {
        return this.#branches.get(branch).get(...path)
      }
    }
    else
    {
      return this
    }
  }

  /**
   * Checks if the specified path exists in the trie, returning true if it does, or false if it
   * doesn't.
   * @param {...*} [path] - The path to check for existence in the trie.
   * @returns {boolean}
   */
  has(...path)
  {
    return this.query(...path).next().done === false
  }

  /**
   * Returns an iterable of all branch keys in the trie of the specified path.
   * Fallback to an empty iterable if the path is not declared.
   * @param {...*} [path] - The path to retrieve the branch keys from.
   * @returns {IterableIterator<*>} - An iterable of all direct branch keys in the trie.
   */
  keys(...path)
  {
    if(path.length)
    {
      return this.get(...path)?.keys() ?? Iterable.from([])
    }
    else
    {
      return this.#branches.keys()
    }
  }

  /**
   * References a branch to a lazyloaded trie instance.
   * @param {...*} branch     - The branch to set the referenced trie on.
   * @param {WildTrie|*} lazy - The trie instance that is being defined to the specified branch. If the 
   *                            `lazy` argument is not already a `WildTrie` instance, then it will be
   *                            wrapped by a new `WildTrie` instance, with the provided value as a state 
   *                            of the created trie-node.
   * @returns {WildTrie}      - Returns the `WildTrie` instance that has been set to the specified branch.
   * @throws {ReferenceError} - E_WILD_TRIE_REFERENCE_CIRCULAR  - If the reference creates a circular path.
   * 
   * @example
   * const trie1 = new WildTrie()
   * const trie2 = new WildTrie()
   * trie1.set('second trie', trie2)
   * trie1.has('second trie')            // true
   * trie2.has('second trie')            // false
   * trie1.get('second trie') === trie2  // true
   */
  set(...path)
  {
    const
      state   = path.pop(),
      branch  = path.pop()

    if(path.length)
    {
      return this.add(...path).set(branch, state)
    }
    else
    {
      const trie = new this.constructor(state)

      for(const decendent of trie.descendants())
      {
        if(decendent === this)
        {
          const error = new ReferenceError('Can not set a trie that creates a circular path')
          error.code  = 'E_WILD_TRIE_CIRCULAR_REFERENCE'
          error.cause = 'The targeted trie is a descendant to the referenced trie'
          throw error
        }
      }
  
      this.#branches.set(branch, trie)

      return trie
    }
  }

  /**
   * Returns the size of the branches trie map.
   * @returns {number} - The number of branches in the trie.
   */
  get size()
  {
    return [ ...this.descendants() ].length
  }

  /**
   * Returns a JSON representation of the trie structure, including all branches and all trie-nodes.
   * @param {number} [depth=Infinity]                 - The depth to which the trie should be serialized.
   * @typedef {Object<*, WildTrieJSON>} WildTrieJSON  - Serialized representation of the WildTrie.
   * @returns {WildTrieJSON}
   */
  toJSON(depth = Infinity)
  {
    const
      json    = {},
      compose = --depth >= 0
        ? trie => this.#branches.size ? trie.toJSON(depth) : trie.state
        : trie => `[${trie.constructor?.name ?? 'Object'}]`

    for(const [ branch, trie ] of this.#branches)
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

    const entries = [ ...this.#branches ]

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
        state     = trie.state !== undefined 
                  ? ` : ${this.#stylize(trie.state, stylize)}` 
                  : ''

      output += `\n${prefix} ${this.#stylize(branch, stylize)}${state}${indented}`
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
   * Returns an iterable of all branches in the trie.
   * If a path is provided, it will return the values of the specified branch trie.
   * Fallback to an empty iterable if the path is not declared.
   * @param {...*} [path] - The path to retrieve the values from.
   * @returns {Iterable<WildTrie>} - An iterable of all direct branches of the trie.
   */
  values(...path)
  {
    if(path.length)
    {
      return this.get(...path)?.values() ?? Iterable.from([])
    }
    else
    {
      return this.#branches.values()
    }
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
   * Yields all descendant branches paired with their associated trie-nodes.
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
    for(const trie of this.query(...path))
    {
      yield * this.#descendants(seen, trie)
    }
  }

  * #descendants(seen, trie)
  {
    for(const branchTrie of trie.values())
    {
      if(false === seen.has(branchTrie))
      {
        seen.add(branchTrie)
        yield branchTrie
        yield * this.#descendants(seen, branchTrie)
      }
    }
  }

  /**
   * Returns a generator that yields all the leaf nodes of the trie that match the specified path.
   * 
   * If the provided path doesn't exist, then an empty iteratot will be returned.
   * 
   * If the path branch is specific, it will return the trie-node that match that branch.
   * 
   * If a path branch is defined using a @see config.wildcard, it will return all trie-nodes of all
   * the defined branches of the trie. 
   * 
   * If a path branch is defined using a @see config.globstar, it will return all the
   * descendants of the trie, including all trie-nodes of all the defined branches of the trie.
   * 
   * @param {*} [branch]
   * @param {...*} [path]
   * @yields {WildTrie} - Each unique leaf node of the provided path.
   */
  * query(...path)
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
   * Returns a generator that yields a trace of trie-nodes between the matched leaf nodes and the root.
   * 
   * This method is useful for tracing each node in the path that leads to a matching leaf node.
   * 
   * @param {...*} [path] - The path to traverse in the trie.
   * @yields {WildTrie}   - Each unique node that is, or ancestor of, a leaf node to the specified path.
   */
  * trace(...path)
  {
    const trace = new WeakSet()

    for(const [ trie, state ] of this.walk(...path))
    {
      if(WildTrie.LEAF === state)
      {
        trace.add(trie)
        yield trie
      }
      else
      {
        for(const branchTrie in trie.values())
        {
          if(trace.has(branchTrie))
          {
            trace.add(trie)
            yield trie
            break
          }
        }
      }
    }
  }

  /**
   * Traverses the trie structure and yields all visited nodes.
   * @param {*} branch 
   * @param  {...*} path 
   * @yields {[WildTrie, Symbol]} - A tuple of the trie-node and a symbol representing the walk-state.
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
    for(const trie of this.#branches.values())
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
    if(this.#branches.has(this.config.wildcard))
    {
      const trie = this.#branches.get(this.config.wildcard)
      if(false === seen.has(trie))
      {
        yield * trie.walk(...path)
      }
    }
  }

  * #walkGlobstarNodeBranch(seen, branch, ...path)
  {
    if(this.#branches.has(this.config.globstar))
    {
      const globstarTrie = this.#branches.get(this.config.globstar)

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
    if(this.#branches.has(branch))
    {
      const trie = this.#branches.get(branch)
      if(false === seen.has(trie))
      {
        yield * trie.walk(...path)
      }
    }
  }
}
