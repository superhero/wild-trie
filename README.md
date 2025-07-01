# Wild Trie

A trie structure with wildcard path support, designed for flexible and dynamic path matching.

## Installation

```bash
npm install @superhero/wild-trie
```

## Usage

### Basic Example

Bellow code example will create a trie with the following structure:

```
WildTrie
└─ A
   ├─ B
   │  ├─ C
   │  └─ D
   └─ E
      └─ F
```

```javascript
import WildTrie from '@superhero/wild-trie'

const trie = new WildTrie()

trie.declare('A', 'B', 'C')
trie.declare('A', 'B', 'D')
trie.declare('A', 'E', 'F')

trie.has('A') // true
trie.has('A', 'B') // true
trie.has('A', 'B', 'C') // true
trie.has('A', 'B', 'D') // true
trie.has('A', 'E', 'F') // true
```

### Wildcard Matching

The trie supports two types of wildcards:

* Branch wildcard (`*`): matches any single branch.
* Globstar wildcard (`**`): matches non or any number of descendant branches.

#### Branch Wildcard

Example of an Access Control List structure used for permission management:

```javascript
const acl = new WildTrie()

acl.declare('admin', '*', '*')

acl.has('admin', 'users', 'create')  // true
acl.has('admin', 'users', 'read')    // true
acl.has('admin', 'posts', 'create')  // true
acl.has('admin', 'posts', 'read')    // true
```

#### Globster Wildcard

Using globstar wildcards (`**`) to manage descendants in permissions, declaration of nested permissions:

```javascript
const acl = new WildTrie()

acl.declare('admin', '**', 'read')
acl.declare('user', 'users', 'settings', 'personal', '**', 'read')

acl.has('admin', 'users', 'settings', 'all', 'read')                // true
acl.has('user', 'users', 'settings', 'personal', 'read')            // true
acl.has('user', 'users', 'settings', 'personal', 'avatar', 'read')  // true
acl.has('user', 'users', 'settings', 'all', 'read')                 // false
```

### Referencing Tries

You can reference other trie nodes to share branches and link structures:

```javascript
const acl = new WildTrie()

acl.declare('group', 'creator', '**', 'create')
acl.declare('group', 'editor',  '**', 'update')
acl.declare('group', 'reader',  '**', 'read')

acl.node('group', 'creator').reference('editor', acl.node('group', 'editor'))
acl.node('group', 'editor') .reference('reader', acl.node('group', 'reader'))

acl.has('group', 'creator', '**', 'create') // true
acl.has('group', 'creator', '**', 'update') // true
acl.has('group', 'creator', '**', 'read')   // true

acl.has('group', 'reader', '**', 'create')  // false
```

> **OBS!** Circular references are not possible...

### Trie Node Variables

Above mentioned example using variable pointers to trie nodes to declare with a less redundant code base.

```javascript
const acl = new WildTrie()

const groups = acl.declare('group')

// When declaring the group branches the trie node representing the group is returned.
const creator = groups.declare('creator')
const editor  = groups.declare('editor')
const reader  = groups.declare('reader')

// Use the group variables to define permissions.
creator.declare('**', 'create')
editor.declare('**', 'update')
reader.declare('**', 'read')

// Reference the groups to create a hierarchy map.
creator.reference('editor', editor)
editor.reference('reader', reader)

// Can check permission usin gthe root acl trie node...
acl.has('group', 'creator', '**', 'create') // true
acl.has('group', 'creator', '**', 'update') // true
acl.has('group', 'creator', '**', 'read')   // true

// ... or using the groups trie node variables.
creator.has('**', 'create') // true
creator.has('**', 'update') // true
creator.has('**', 'read')   // true

editor.has('**', 'create') // false
editor.has('**', 'update') // true
editor.has('**', 'read')   // true

reader.has('**', 'create') // false
reader.has('**', 'update') // false
reader.has('**', 'read')   // true
```

## API

### Constructor

The constructor provides an ability to declare a `WildTrie` structure from the provided construction value.

```javascript
const trie = new WildTrie({ foo: { bar: { baz: { qux: 'foobar' } } } })
trie.node('foo', 'bar', 'baz', 'qux').value // 'foobar'
```

### Methods

- `.declare(...path)`         - Declares and returns the trie node for the specified path.
- `.define(value)`            - Defines a value at the trie node.
- `.delete(...path)`          - Deletes the branch at the specified path.
- `.descendants(...path)`     - Retrieves all descendant branches and sub-tries from the specified path.
- `.has(...path)`             - Checks if the path exists.
- `.node(...path)`            - Retrieves the specified trie node at the provided direct path.
- `.reference(branch, trie)`  - Creates a reference from the current node to another trie node.
- `.leafs(...path)`           - Traverses the trie structure using wildcards, returns leaf-tries that match the specified path.
- `.leafValues(...path)`      - Returns defined leaf values at the specified path.
- `.trail(...path)`           - Traverses the trie structure in the same way `leafs` method does, returns the leaf nodes, all ancestors.
- `.trailValues(...path)`     - Returns defined values in all the nodes that are ancestors to the specified path, including the leafs.

### Serialization

- `.toJSON()`     - Serializes trie structure to JSON format.
- `.toString()`   - Serializes the trie structure as a tree format.

### Inspection

- Supports custom Node.js `util.inspect` functionality for readable console output.

## Error Handling

The class throws descriptive errors when improper configurations or references occur, aiding debugging and validation.

- **TypeError**      - `E_WILD_TRIE_CONFIG` - When assigning a configurations you must use an Object.
- **TypeError**      - `E_WILD_TRIE_REFERENCE_BRANCH` - The branch must be defined when referencing a trie.
- **TypeError**      - `E_WILD_TRIE_REFERENCE_INSTANCE` - The referenced trie must be an instance of WildTrie.
- **ReferenceError** - `E_WILD_TRIE_REFERENCE_CIRCULAR` - Can not reference a trie if it creates a circular path.

## Test Suite

The module includes tests focused on ACL use cases to verify the WildTrie - using wildcard behavior, descendants matching, and trie references.

Run tests using:

```bash
npm test
```

### Test Coverage
```
────────────────────────────────── ⋅⋆ Suite ⋆⋅ ─────────────────────────────────


@superhero/wild-trie 
├─ Can declare a WildTrie instance from the constructor 
│  ├─ Can declare a basic WildTrie instance ✔ 1.157ms
│  ├─ Can declare a WildTrie instance with a wildcard ✔ 0.173ms
│  ├─ Can declare a WildTrie instance with a specified string value ✔ 0.138ms
│  ├─ Can declare a WildTrie instance with a specified function value ✔ 0.160ms
│  └─ ✔ 3.725ms
├─ Can use the WildTrie class to structure an ACL instance 
│  ├─ Can use the WildTrie class to structure a basic ACL instance 
│  │  ├─ An admin can read users 
│  │  │  ├─ A user can read users ✔ 0.272ms
│  │  │  └─ ✔ 0.984ms
│  │  ├─ An admin can create users 
│  │  │  ├─ A user can not create users ✔ 0.213ms
│  │  │  └─ ✔ 0.651ms
│  │  └─ ✔ 2.248ms
│  ├─ Can use branch wildcards 
│  │  ├─ An admin can read users 
│  │  │  ├─ A user can read users ✔ 0.408ms
│  │  │  ├─ A guest can not read users ✔ 0.121ms
│  │  │  └─ ✔ 0.818ms
│  │  ├─ An admin can create users 
│  │  │  ├─ A user can not create users ✔ 0.250ms
│  │  │  ├─ A guest can not create users ✔ 0.087ms
│  │  │  └─ ✔ 0.538ms
│  │  ├─ An admin has the permission to access all users 
│  │  │  ├─ A user do not have the permission to access all users ✔ 0.095ms
│  │  │  ├─ A guest do not have the permission to access all users ✔ 0.098ms
│  │  │  └─ ✔ 0.380ms
│  │  ├─ An admin can read resource A 
│  │  │  ├─ A user can read resource A ✔ 0.093ms
│  │  │  ├─ A guest can read resource A ✔ 0.095ms
│  │  │  └─ ✔ 0.402ms
│  │  ├─ An admin can create resource A 
│  │  │  ├─ A user can create resource A ✔ 0.108ms
│  │  │  ├─ A guest can not create resource A ✔ 0.091ms
│  │  │  └─ ✔ 0.413ms
│  │  └─ ✔ 3.144ms
│  ├─ Can use descendants wildcards to check permissions 
│  │  ├─ An admin has permissions 
│  │  │  ├─ A user has permissions ✔ 0.133ms
│  │  │  ├─ A guest has no permissions ✔ 0.083ms
│  │  │  └─ ✔ 1.339ms
│  │  ├─ An admin can read its personal settings 
│  │  │  ├─ A user can read its personal settings ✔ 0.094ms
│  │  │  ├─ A guest can not read users settings ✔ 0.076ms
│  │  │  └─ ✔ 0.355ms
│  │  ├─ An admin can read all users settings 
│  │  │  ├─ A user can not read all users settings ✔ 0.096ms
│  │  │  └─ ✔ 0.222ms
│  │  ├─ An admin can read something 
│  │  │  ├─ A user can read something ✔ 0.226ms
│  │  │  ├─ A user can read som personal settings ✔ 0.099ms
│  │  │  ├─ A user can update some of its personal settings ✔ 0.103ms
│  │  │  └─ ✔ 0.691ms
│  │  ├─ An admin can delete something 
│  │  │  ├─ A user can not delete something ✔ 0.213ms
│  │  │  └─ ✔ 0.358ms
│  │  └─ ✔ 3.360ms
│  ├─ Can use descendants wildcards to declare permissions 
│  │  ├─ An admin has access to read personal settings 
│  │  │  ├─ A user has access to read personal settings ✔ 0.124ms
│  │  │  ├─ A user has access to read nested personal settings ✔ 0.244ms
│  │  │  ├─ A user has access to read multiple nested personal settings ✔ 0.216ms
│  │  │  ├─ A user can not read all settings ✔ 0.121ms
│  │  │  ├─ A user can not update personal settings ✔ 0.115ms
│  │  │  ├─ A user can not update nested personal settings ✔ 0.139ms
│  │  │  └─ ✔ 1.504ms
│  │  └─ ✔ 1.703ms
│  ├─ Can reference a shared trie 
│  │  ├─ A creator references an editor ✔ 0.117ms
│  │  ├─ A creator references a cleaner ✔ 0.095ms
│  │  ├─ A creator references a reader ✔ 0.095ms
│  │  ├─ An editor references a reader ✔ 0.101ms
│  │  ├─ A cleaner references a reader ✔ 0.162ms
│  │  ├─ A reader does not reference an editor ✔ 0.179ms
│  │  ├─ A reader does not reference a cleaner ✔ 0.102ms
│  │  ├─ A reader does not reference a creator ✔ 0.093ms
│  │  ├─ An editor does not reference a creator ✔ 0.096ms
│  │  ├─ An editor does not reference a cleaner ✔ 0.097ms
│  │  ├─ A cleaner does not reference a creator ✔ 0.107ms
│  │  ├─ A cleaner does not reference an editor ✔ 0.096ms
│  │  └─ ✔ 2.344ms
│  └─ ✔ 13.044ms
├─ Transform 
│  ├─ Can use toJSON ✔ 0.384ms
│  ├─ Can use toString ✔ 0.603ms
│  └─ ✔ 1.122ms
└─ ✔ 18.546ms


──────────────────────────────── ⋅⋆ Coverage ⋆⋅ ────────────────────────────────


Files                                            Coverage   Functions   Branches
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
index.js                                              84%         80%        85%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
index.test.js                                        100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Total                                                 90%        91%         93%


───────────────────────────────── ⋅⋆ Summary ⋆⋅ ────────────────────────────────


Suites                                                                         4
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Tests                                                                         63
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Passed                                                                        63
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Failed                                                                         0
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Cancelled                                                                      0
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Skipped                                                                        0
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Todo                                                                           0
```

## License

This project is licensed under the MIT License.

## Contributing

Feel free to submit issues or pull requests for improvements or additional features.
