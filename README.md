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

acl.has('admin', 'users', 'settings', 'all',       'read')           // true
acl.has('user',  'users', 'settings', 'personal',  'read')           // true
acl.has('user',  'users', 'settings', 'personal',  'avatar', 'read') // true
acl.has('user',  'users', 'settings', 'all',       'read')           // false
```

### Referencing Tries

You can reference other trie-nodes to share branches and link structures:

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

### Trie-Node Variables

Above mentioned example using variable pointers to trie-nodes to declare with a less redundant code base.

```javascript
const acl = new WildTrie()

const groups = acl.declare('group')

// When declaring the group branches the trie-node representing the group is returned.
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

// Can check permission usin gthe root acl trie-node...
acl.has('group', 'creator', '**', 'create') // true
acl.has('group', 'creator', '**', 'update') // true
acl.has('group', 'creator', '**', 'read')   // true

// ... or using the groups trie-node variables.
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

- `.clear(...path)`           - Clear all descendant branches at the specified path.
- `.declare(...path)`         - Declares and returns the trie-node for the specified path.
- `.define(value)`            - Defines a value at the trie-node.
- `.delete(...path)`          - Deletes the branch at the specified path.
- `.descendants(...path)`     - Retrieves all descendant trie-nodes from the specified path.
- `.has(...path)`             - Checks if the path exists.
- `.node(...path)`            - Retrieves the specified trie-node at the provided direct path.
- `.reference(branch, trie)`  - Creates a reference from the current node to another trie-node.
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
│  ├─ Can declare a basic WildTrie instance ✔ 1.719ms
│  ├─ Can declare a WildTrie instance with a wildcard ✔ 0.245ms
│  ├─ Can declare a WildTrie instance with a specified string value ✔ 0.190ms
│  ├─ Can declare a WildTrie instance with a specified function value ✔ 0.275ms
│  └─ ✔ 4.964ms
├─ Can use the WildTrie class to structure an ACL instance 
│  ├─ Can use the WildTrie class to structure a basic ACL instance 
│  │  ├─ An admin can read users 
│  │  │  ├─ A user can read users ✔ 0.499ms
│  │  │  └─ ✔ 2.229ms
│  │  ├─ An admin can create users 
│  │  │  ├─ A user can not create users ✔ 0.310ms
│  │  │  └─ ✔ 1.166ms
│  │  └─ ✔ 4.493ms
│  ├─ Can use branch wildcards 
│  │  ├─ An admin can read users 
│  │  │  ├─ A user can read users ✔ 0.700ms
│  │  │  ├─ A guest can not read users ✔ 0.281ms
│  │  │  └─ ✔ 1.374ms
│  │  ├─ An admin can create users 
│  │  │  ├─ A user can not create users ✔ 0.379ms
│  │  │  ├─ A guest can not create users ✔ 0.132ms
│  │  │  └─ ✔ 0.867ms
│  │  ├─ An admin has the permission to access all users 
│  │  │  ├─ A user do not have the permission to access all users ✔ 0.147ms
│  │  │  ├─ A guest do not have the permission to access all users ✔ 0.203ms
│  │  │  └─ ✔ 0.634ms
│  │  ├─ An admin can read resource A 
│  │  │  ├─ A user can read resource A ✔ 0.136ms
│  │  │  ├─ A guest can read resource A ✔ 0.159ms
│  │  │  └─ ✔ 0.587ms
│  │  ├─ An admin can create resource A 
│  │  │  ├─ A user can create resource A ✔ 0.154ms
│  │  │  ├─ A guest can not create resource A ✔ 0.131ms
│  │  │  └─ ✔ 0.580ms
│  │  └─ ✔ 4.816ms
│  ├─ Can use descendants wildcards to check permissions 
│  │  ├─ An admin has permissions 
│  │  │  ├─ A user has permissions ✔ 1.125ms
│  │  │  ├─ A guest has no permissions ✔ 0.169ms
│  │  │  └─ ✔ 1.711ms
│  │  ├─ An admin can read its personal settings 
│  │  │  ├─ A user can read its personal settings ✔ 0.131ms
│  │  │  ├─ A guest can not read users settings ✔ 0.108ms
│  │  │  └─ ✔ 0.515ms
│  │  ├─ An admin can read all users settings 
│  │  │  ├─ A user can not read all users settings ✔ 0.134ms
│  │  │  └─ ✔ 0.311ms
│  │  ├─ An admin can read something 
│  │  │  ├─ A user can read something ✔ 0.359ms
│  │  │  ├─ A user can read som personal settings ✔ 0.127ms
│  │  │  ├─ A user can update some of its personal settings ✔ 0.145ms
│  │  │  └─ ✔ 0.992ms
│  │  ├─ An admin can delete something 
│  │  │  ├─ A user can not delete something ✔ 0.281ms
│  │  │  └─ ✔ 0.491ms
│  │  └─ ✔ 4.586ms
│  ├─ Can use descendants wildcards to declare permissions 
│  │  ├─ An admin has access to read personal settings 
│  │  │  ├─ A user has access to read personal settings ✔ 0.174ms
│  │  │  ├─ A user has access to read nested personal settings ✔ 0.181ms
│  │  │  ├─ A user has access to read multiple nested personal settings ✔ 0.176ms
│  │  │  ├─ A user can not read all settings ✔ 0.124ms
│  │  │  ├─ A user can not update personal settings ✔ 0.147ms
│  │  │  ├─ A user can not update nested personal settings ✔ 0.188ms
│  │  │  └─ ✔ 1.667ms
│  │  └─ ✔ 1.917ms
│  ├─ Can delete branches from the WildTrie 
│  │  ├─ Deleting a specific permission ✔ 0.238ms
│  │  ├─ Deleting a specific resource ✔ 0.169ms
│  │  ├─ Deleting with no path does nothing ✔ 0.173ms
│  │  ├─ Clear all descendant nodes ✔ 0.270ms
│  │  └─ ✔ 1.450ms
│  ├─ Can reference a shared trie 
│  │  ├─ A creator references an editor ✔ 0.169ms
│  │  ├─ A creator references a cleaner ✔ 0.137ms
│  │  ├─ A creator references a reader ✔ 0.144ms
│  │  ├─ An editor references a reader ✔ 0.122ms
│  │  ├─ A cleaner references a reader ✔ 0.126ms
│  │  ├─ A reader does not reference an editor ✔ 0.280ms
│  │  ├─ A reader does not reference a cleaner ✔ 0.146ms
│  │  ├─ A reader does not reference a creator ✔ 0.135ms
│  │  ├─ An editor does not reference a creator ✔ 0.131ms
│  │  ├─ An editor does not reference a cleaner ✔ 0.131ms
│  │  ├─ A cleaner does not reference a creator ✔ 0.174ms
│  │  ├─ A cleaner does not reference an editor ✔ 0.144ms
│  │  └─ ✔ 3.135ms
│  └─ ✔ 23.809ms
├─ Transform 
│  ├─ Can use toJSON ✔ 0.638ms
│  ├─ Can use toString ✔ 0.789ms
│  └─ ✔ 1.636ms
└─ ✔ 32.885ms


──────────────────────────────── ⋅⋆ Coverage ⋆⋅ ────────────────────────────────


Files                                            Coverage   Functions   Branches
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
index.js                                              85%         81%        84%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
index.test.js                                        100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Total                                                 91%        90%         94%


───────────────────────────────── ⋅⋆ Summary ⋆⋅ ────────────────────────────────


Suites                                                                         4
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Tests                                                                         68
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Passed                                                                        68
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
