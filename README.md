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

The constructor allows to configure what symbols are used to represent wildcards.

```javascript
// Defaults if not configurations are passed are set to: `*` and `**`
new WildTrie({ wildcard: '*', globstar: '**' });
```

### Methods

- `.declare(...path)` - Declares and returns the trie node for the specified path.
- `.define(value)` - Defines a value at the trie node.
- `.delete(...path)` - Deletes the branch at the specified path.
- `.descendants(...path)` - Retrieves all descendant branches and sub-tries from the specified path.
- `.get(...path)` - Returns all the defined values as an array at the specified path.
- `.has(...path)` - Checks if the path exists.
- `.node(...path)` - Retrieves the specified trie node at the provided direct path.
- `.reference(branch, trie)` - Creates a reference from the current node to another trie node.
- `.traverse(...path)` - Traverses the trie structure using wildcards, returns tries that match the specified path. 

### Serialization

- `.toJSON()` - Serializes trie structure to JSON format.
- `.toString()` - Serializes the trie structure as a tree format.

### Inspection

- Supports custom Node.js `util.inspect` functionality for readable console output.

## Error Handling

The class throws descriptive errors when improper configurations or references occur, aiding debugging and validation.

- **TypeError** - `E_WILD_TRIE_CONFIG` - When assigning a configurations you must use an Object.
- **TypeError** - `E_WILD_TRIE_REFERENCE_BRANCH` - The branch must be defined when referencing a trie.
- **TypeError** - `E_WILD_TRIE_REFERENCE_INSTANCE` - The referenced trie must be an instance of WildTrie.
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
├─ Can use the WildTrie class to structure an ACL instance
│  ├─ Can use the WildTrie class to structure a basic ACL instance
│  │  ├─ An admin can read users
│  │  │  ├─ A user can read users
│  │  │  │  └─ ✔ passed 0.847317ms
│  │  │  └─ ✔ passed 1.827469ms
│  │  ├─ An admin can create users
│  │  │  ├─ A user can not create users
│  │  │  │  └─ ✔ passed 0.366054ms
│  │  │  └─ ✔ passed 1.063366ms
│  │  └─ ✔ passed 4.877404ms
│  ├─ Can use branch wildcards
│  │  ├─ An admin can read users
│  │  │  ├─ A user can read users
│  │  │  │  └─ ✔ passed 0.161938ms
│  │  │  ├─ A guest can not read users
│  │  │  │  └─ ✔ passed 0.248884ms
│  │  │  └─ ✔ passed 0.879528ms
│  │  ├─ An admin can create users
│  │  │  ├─ A user can not create users
│  │  │  │  └─ ✔ passed 0.303434ms
│  │  │  ├─ A guest can not create users
│  │  │  │  └─ ✔ passed 0.12622ms
│  │  │  └─ ✔ passed 0.995169ms
│  │  ├─ An admin has the permission to access all users
│  │  │  ├─ A user do not have the permission to access all users
│  │  │  │  └─ ✔ passed 0.096962ms
│  │  │  ├─ A guest do not have the permission to access all users
│  │  │  │  └─ ✔ passed 0.163484ms
│  │  │  └─ ✔ passed 0.485246ms
│  │  ├─ An admin can read resource A
│  │  │  ├─ A user can read resource A
│  │  │  │  └─ ✔ passed 0.149878ms
│  │  │  ├─ A guest can read resource A
│  │  │  │  └─ ✔ passed 0.080611ms
│  │  │  └─ ✔ passed 0.497481ms
│  │  ├─ An admin can create resource A
│  │  │  ├─ A user can create resource A
│  │  │  │  └─ ✔ passed 0.120758ms
│  │  │  ├─ A guest can not create resource A
│  │  │  │  └─ ✔ passed 0.080103ms
│  │  │  └─ ✔ passed 0.453211ms
│  │  └─ ✔ passed 4.044815ms
│  ├─ Can use descendants wildcards to check permissions
│  │  ├─ An admin has permissions
│  │  │  ├─ A user has permissions
│  │  │  │  └─ ✔ passed 0.14598ms
│  │  │  ├─ A guest has no permissions
│  │  │  │  └─ ✔ passed 0.075894ms
│  │  │  └─ ✔ passed 0.691003ms
│  │  ├─ An admin can read its personal settings
│  │  │  ├─ A user can read its personal settings
│  │  │  │  └─ ✔ passed 0.140849ms
│  │  │  ├─ A guest can not read users settings
│  │  │  │  └─ ✔ passed 0.119044ms
│  │  │  └─ ✔ passed 0.485148ms
│  │  ├─ An admin can read all users settings
│  │  │  ├─ A user can not read all users settings
│  │  │  │  └─ ✔ passed 0.175829ms
│  │  │  └─ ✔ passed 0.34056ms
│  │  ├─ An admin can read something
│  │  │  ├─ A user can read something
│  │  │  │  └─ ✔ passed 0.2139ms
│  │  │  ├─ A user can read som personal settings
│  │  │  │  └─ ✔ passed 1.30917ms
│  │  │  ├─ A user can update some of its personal settings
│  │  │  │  └─ ✔ passed 0.224445ms
│  │  │  └─ ✔ passed 2.184856ms
│  │  ├─ An admin can delete something
│  │  │  ├─ A user can not delete something
│  │  │  │  └─ ✔ passed 0.211477ms
│  │  │  └─ ✔ passed 0.539043ms
│  │  └─ ✔ passed 4.718736ms
│  ├─ Can use descendants wildcards to declare permissions
│  │  ├─ An admin has access to read personal settings
│  │  │  ├─ A user has access to read personal settings
│  │  │  │  └─ ✔ passed 0.115956ms
│  │  │  ├─ A user has access to read nested personal settings
│  │  │  │  └─ ✔ passed 0.170762ms
│  │  │  ├─ A user has access to read multiple nested personal settings
│  │  │  │  └─ ✔ passed 0.096136ms
│  │  │  ├─ A user can not read all settings
│  │  │  │  └─ ✔ passed 0.106284ms
│  │  │  ├─ A user can not update personal settings
│  │  │  │  └─ ✔ passed 0.099669ms
│  │  │  ├─ A user can not update nested personal settings
│  │  │  │  └─ ✔ passed 0.086438ms
│  │  │  └─ ✔ passed 1.203759ms
│  │  └─ ✔ passed 1.411007ms
│  ├─ Can reference a shared trie
│  │  ├─ A creator references an editor
│  │  │  └─ ✔ passed 0.114044ms
│  │  ├─ A creator references a cleaner
│  │  │  └─ ✔ passed 0.153974ms
│  │  ├─ A creator references a reader
│  │  │  └─ ✔ passed 0.202553ms
│  │  ├─ An editor references a reader
│  │  │  └─ ✔ passed 0.146667ms
│  │  ├─ A cleaner references a reader
│  │  │  └─ ✔ passed 0.243966ms
│  │  ├─ A reader does not reference an editor
│  │  │  └─ ✔ passed 0.119554ms
│  │  ├─ A reader does not reference a cleaner
│  │  │  └─ ✔ passed 0.082625ms
│  │  ├─ A reader does not reference a creator
│  │  │  └─ ✔ passed 0.102876ms
│  │  ├─ An editor does not reference a creator
│  │  │  └─ ✔ passed 0.120406ms
│  │  ├─ An editor does not reference a cleaner
│  │  │  └─ ✔ passed 0.078773ms
│  │  ├─ A cleaner does not reference a creator
│  │  │  └─ ✔ passed 0.085165ms
│  │  ├─ A cleaner does not reference an editor
│  │  │  └─ ✔ passed 0.087533ms
│  │  └─ ✔ passed 2.590132ms
│  └─ ✔ suite passed 18.649088ms
├─ Transform
│  ├─ Can use toJSON
│  │  └─ ✔ passed 0.375166ms
│  ├─ Can use toString
│  │  └─ ✔ passed 0.476709ms
│  └─ ✔ suite passed 0.977785ms
└─ ✔ suite passed 20.569422ms


──────────────────────────────── ⋅⋆ Coverage ⋆⋅ ────────────────────────────────


Files                                            Coverage   Branches   Functions
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
index.js                                              86%        80%         77%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
index.test.js                                        100%       100%        100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Total                                                 92%        90%         93%


───────────────────────────────── ⋅⋆ Summary ⋆⋅ ────────────────────────────────


Suites                                                                         3
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Tests                                                                         59
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Passed                                                                        59
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
