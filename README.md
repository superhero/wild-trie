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

trie.add('A', 'B', 'C')
trie.add('A', 'B', 'D')
trie.add('A', 'E', 'F')

// Correct paths
trie.has('A')            // true
trie.has('A', 'B')       // true
trie.has('A', 'B', 'C')  // true
trie.has('A', 'B', 'D')  // true
trie.has('A', 'E', 'F')  // true

// Incorect paths
trie.has('B')            // false
trie.has('C')            // false
trie.has('D', 'B')       // false
trie.has('E', 'B', 'D')  // false
trie.has('A', 'F')       // false
```

### Wildcard Matching

The trie supports two types of wildcards:

* Branch wildcard (`*`): matches any single branch.
* Globstar wildcard (`**`): matches non or any number of descendant branches.

#### Branch Wildcard

Example of an Access Control List structure used for permission management:

```javascript
const acl = new WildTrie()

acl.add('admin', '*', '*')

acl.has('admin', 'users', 'create')  // true
acl.has('admin', 'users', 'read')    // true
acl.has('admin', 'posts', 'create')  // true
acl.has('admin', 'posts', 'read')    // true
```

#### Globster Wildcard

Using globstar wildcards (`**`) to manage descendants in permissions, declaration of nested permissions:

```javascript
const acl = new WildTrie()

acl.add('admin', '**', 'read')
acl.add('user', 'users', 'settings', 'personal', '**', 'read')

acl.has('admin', 'users', 'settings', 'all',       'read')           // true
acl.has('user',  'users', 'settings', 'personal',  'read')           // true
acl.has('user',  'users', 'settings', 'personal',  'avatar', 'read') // true
acl.has('user',  'users', 'settings', 'all',       'read')           // false
```

### Referencing Tries

You can reference other trie-nodes to share branches and link structures:

```javascript
const acl = new WildTrie()

acl.add('group', 'creator', '**', 'create')
acl.add('group', 'editor',  '**', 'update')
acl.add('group', 'reader',  '**', 'read')

acl.set('group', 'creator', 'editor', acl.get('group', 'editor'))
acl.set('group', 'editor',  'reader', acl.get('group', 'reader'))

acl.has('group', 'creator', '**', 'create') // true
acl.has('group', 'creator', '**', 'update') // true
acl.has('group', 'creator', '**', 'read')   // true

acl.has('group', 'reader', '**', 'create')  // false
```

> **OBS!** Circular references are not possible...

### Trie-Node Variables

When a trie-node has been added, it is returned and can be used as a variable.

```javascript
const acl = new WildTrie()

// Declare a group namespace.
const groups = acl.add('group')

// When declaring the group branches the trie-node representing the group is returned.
const creator = groups.add('creator')
const editor  = groups.add('editor')
const reader  = groups.add('reader')

// Use the group variables to define permissions.
creator.add('**', 'create')
editor .add('**', 'update')
reader .add('**', 'read')

// Reference the groups to create a hierarchy map.
creator.set('editor', editor)
editor .set('reader', reader)

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

The constructor provides an ability to define a `WildTrie` structure by providing an optional construction argument.

```javascript
const trie = new WildTrie({ foo: { bar: { baz: { qux: 'foobar' } } } })
trie.get('foo', 'bar', 'baz', 'qux').state // 'foobar'
```

### Methods

- `.add(...path)`           - Declares and returns the trie-node at the end of the specified branch-path.
- `.clear(...path)`         - Clear all descendant branches at the specified branch-path.
- `.delete(...path)`        - Deletes the branch at the specified branch-path.
- `.descendants(...path)`   - Retrieves all descendant trie-nodes from the specified branch-path.
- `.has(...path)`           - Checks if the branch-path exists.
- `.get(...path)`           - Retrieves the specified trie-node at the provided direct branch-path.
- `.set(...path, trie)`     - Set a lazyloaded trie-node at the specified branch-path.
- `.query(...path)`         - Traverses the trie structure using wildcards, returns leaf-tries that match the specified branch-path.
- `.trace(...path)`         - Traverses the trie structure in the same way the `query` method does, returns a traced result from the matched leaf nodes including all the ancestors.

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
├─ Can define a WildTrie instance from the constructor 
│  ├─ Can define a basic WildTrie instance ✔ 3.219ms
│  ├─ Can define a WildTrie instance with a wildcard ✔ 0.290ms
│  ├─ Can define a WildTrie instance with a specified string state ✔ 1.016ms
│  ├─ Can define a WildTrie instance with a specified function state ✔ 0.222ms
│  └─ ✔ 5.801ms
├─ Can use the WildTrie class to structure an ACL instance 
│  ├─ Can use the WildTrie class to structure a basic ACL instance 
│  │  ├─ An admin can read users 
│  │  │  ├─ A user can read users ✔ 0.254ms
│  │  │  └─ ✔ 0.812ms
│  │  ├─ An admin can create users 
│  │  │  ├─ A user can not create users ✔ 0.216ms
│  │  │  └─ ✔ 0.732ms
│  │  └─ ✔ 2.163ms
│  ├─ Can use branch wildcards 
│  │  ├─ An admin can read users 
│  │  │  ├─ A user can read users ✔ 0.658ms
│  │  │  ├─ A guest can not read users ✔ 0.272ms
│  │  │  └─ ✔ 1.375ms
│  │  ├─ An admin can create users 
│  │  │  ├─ A user can not create users ✔ 0.256ms
│  │  │  ├─ A guest can not create users ✔ 0.126ms
│  │  │  └─ ✔ 0.659ms
│  │  ├─ An admin has the permission to access all users 
│  │  │  ├─ A user do not have the permission to access all users ✔ 0.099ms
│  │  │  ├─ A guest do not have the permission to access all users ✔ 0.097ms
│  │  │  └─ ✔ 0.402ms
│  │  ├─ An admin can read resource A 
│  │  │  ├─ A user can read resource A ✔ 0.111ms
│  │  │  ├─ A guest can read resource A ✔ 0.122ms
│  │  │  └─ ✔ 0.449ms
│  │  ├─ An admin can create resource A 
│  │  │  ├─ A user can create resource A ✔ 0.120ms
│  │  │  ├─ A guest can not create resource A ✔ 0.100ms
│  │  │  └─ ✔ 0.458ms
│  │  └─ ✔ 3.907ms
│  ├─ Can use descendants wildcards to check permissions 
│  │  ├─ An admin has permissions 
│  │  │  ├─ A user has permissions ✔ 0.130ms
│  │  │  ├─ A guest has no permissions ✔ 0.082ms
│  │  │  └─ ✔ 0.507ms
│  │  ├─ An admin can read its personal settings 
│  │  │  ├─ A user can read its personal settings ✔ 0.100ms
│  │  │  ├─ A guest can not read users settings ✔ 0.147ms
│  │  │  └─ ✔ 0.463ms
│  │  ├─ An admin can read all users settings 
│  │  │  ├─ A user can not read all users settings ✔ 0.093ms
│  │  │  └─ ✔ 0.223ms
│  │  ├─ An admin can read something 
│  │  │  ├─ A user can read something ✔ 0.113ms
│  │  │  ├─ A user can read som personal settings ✔ 0.094ms
│  │  │  ├─ A user can update some of its personal settings ✔ 0.100ms
│  │  │  └─ ✔ 0.563ms
│  │  ├─ An admin can delete something 
│  │  │  ├─ A user can not delete something ✔ 0.128ms
│  │  │  └─ ✔ 0.284ms
│  │  └─ ✔ 2.512ms
│  ├─ Can use descendants wildcards to add permissions 
│  │  ├─ An admin has access to read personal settings 
│  │  │  ├─ A user has access to read personal settings ✔ 0.135ms
│  │  │  ├─ A user has access to read nested personal settings ✔ 0.129ms
│  │  │  ├─ A user has access to read multiple nested personal settings ✔ 0.202ms
│  │  │  ├─ A user can not read all settings ✔ 0.212ms
│  │  │  ├─ A user can not update personal settings ✔ 0.303ms
│  │  │  ├─ A user can not update nested personal settings ✔ 0.179ms
│  │  │  └─ ✔ 1.751ms
│  │  └─ ✔ 1.959ms
│  ├─ Can delete branches from the WildTrie 
│  │  ├─ Deleting a specific permission ✔ 0.199ms
│  │  ├─ Deleting a specific resource ✔ 0.131ms
│  │  ├─ Deleting with no path does nothing ✔ 0.124ms
│  │  ├─ Clear all descendant nodes ✔ 0.231ms
│  │  └─ ✔ 1.254ms
│  ├─ Can reference a shared trie 
│  │  ├─ A creator references an editor ✔ 0.178ms
│  │  ├─ A creator references a cleaner ✔ 0.142ms
│  │  ├─ A creator references a reader ✔ 0.113ms
│  │  ├─ An editor references a reader ✔ 0.104ms
│  │  ├─ A cleaner references a reader ✔ 0.111ms
│  │  ├─ A reader does not reference an editor ✔ 0.233ms
│  │  ├─ A reader does not reference a cleaner ✔ 0.163ms
│  │  ├─ A reader does not reference a creator ✔ 0.093ms
│  │  ├─ An editor does not reference a creator ✔ 0.103ms
│  │  ├─ An editor does not reference a cleaner ✔ 0.098ms
│  │  ├─ A cleaner does not reference a creator ✔ 0.202ms
│  │  ├─ A cleaner does not reference an editor ✔ 0.154ms
│  │  └─ ✔ 3.001ms
│  └─ ✔ 15.777ms
├─ Transform 
│  ├─ Can use toJSON ✔ 0.383ms
│  ├─ Can use toString ✔ 0.669ms
│  └─ ✔ 1.181ms
└─ ✔ 23.524ms


──────────────────────────────── ⋅⋆ Coverage ⋆⋅ ────────────────────────────────


Files                                            Coverage   Functions   Branches
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
index.js                                              86%         81%        85%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
index.test.js                                        100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Total                                                 92%        91%         94%


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
