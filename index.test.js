import WildTrie         from '@superhero/wild-trie'
import contextualAssert from '@superhero/audit/assert/contextual'
import { suite, test }  from 'node:test'

suite('@superhero/wild-trie', () =>
{
  suite('Can define a WildTrie instance from the constructor', () =>
  {
    test('Can define a basic WildTrie instance', async sub =>
    {
      const trie = new WildTrie({ foo: { bar: { baz: { qux: 'foobar' } } } })

      const assert = contextualAssert({ trie })

      assert.strictEqual(trie.get('foo', 'bar', 'baz', 'qux').state, 'foobar', 'The state of the node should be "foobar"')
    })

    test('Can define a WildTrie instance with a wildcard', async sub =>
    {
      const trie = new WildTrie({ foo: { bar: { '*': 'qux' } } })

      const assert = contextualAssert({ trie })

      assert.strictEqual(trie.get('foo', 'bar', '*').state, 'qux', 'The state of the node should be "qux"')
    })

    test('Can define a WildTrie instance with a specified string state', async sub =>
    {
      const trie = new WildTrie('foobar')

      const assert = contextualAssert({ trie })

      assert.strictEqual(trie.state, 'foobar', 'The state of the node should be "foobar"')
    })

    test('Can define a WildTrie instance with a specified function state', async sub =>
    {
      const callback = () => 'foobar'

      const trie = new WildTrie(callback)

      const assert = contextualAssert({ trie })

      assert.strictEqual(trie.state, callback, 'The state of the node should be the callback function')
      assert.strictEqual(trie.state(), 'foobar', 'The state of the node should return "foobar" when called')
    })
  })

  suite('Can use the WildTrie class to structure an ACL instance', () =>
  {
    test('Can use the WildTrie class to structure a basic ACL instance', async sub =>
    {
      const acl = new WildTrie()

      acl.add('admin', 'users', 'read')
      acl.add('admin', 'users', 'create')
      acl.add('user',  'users', 'read')

      const assert = contextualAssert({ acl })

      await sub.test('An admin can read users', async sub =>
      {
        assert.strictEqual(acl.has('admin', 'users', 'read'), true, 'An admin should have access to read users')

        await sub.test('A user can read users', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'read'), true, 'A user should have access to read users')
        })
      })

      await sub.test('An admin can create users', async sub =>
      {
        assert.strictEqual(acl.has('admin', 'users', 'create'), true, 'An admin should have access to create users')

        await sub.test('A user can not create users', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'create'), false, 'A user should not have access to create users')
        })
      })
    })

    test('Can use branch wildcards', async sub =>
    {
      const acl = new WildTrie()

      acl.add('admin', '*', '*')

      acl.add('user', 'users', 'read')
      acl.add('user', 'resource-A', '*')

      acl.add('guest', 'resource-A', 'read')

      const assert = contextualAssert({ acl })

      await sub.test('An admin can read users', async sub =>
      {
        assert.strictEqual(acl.has('admin', 'users', 'read'), true, 'An admin should have access to read users')

        await sub.test('A user can read users', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'read'), true, 'A user should have access to read users')
        })

        await sub.test('A guest can not read users', () =>
        {
          assert.strictEqual(acl.has('guest', 'users', 'read'), false, 'A guest should not have access to read users')
        })
      })

      await sub.test('An admin can create users', async sub =>
      {
        assert.strictEqual(acl.has('admin', 'users', 'create'), true, 'An admin should have access to create users')

        await sub.test('A user can not create users', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'create'), false, 'A user should not have access to create users')
        })

        await sub.test('A guest can not create users', () =>
        {
          assert.strictEqual(acl.has('guest', 'users', 'create'), false, 'A guest should not have access to create users')
        })
      })

      await sub.test('An admin has the permission to access all users', async sub =>
      {
        assert.strictEqual(acl.has('admin', 'users', 'access-all'), true, 'An admin should have access to all users')

        await sub.test('A user do not have the permission to access all users', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'access-all'), false, 'A user should not have access to all users')
        })

        await sub.test('A guest do not have the permission to access all users', () =>
        {
          assert.strictEqual(acl.has('guest', 'users', 'access-all'), false, 'A guest should not have access to all users')
        })
      })

      await sub.test('An admin can read resource A', async sub =>
      {
        assert.strictEqual(acl.has('admin', 'resource-A', 'read'), true, 'An admin should have access to read resource A')

        await sub.test('A user can read resource A', () =>
        {
          assert.strictEqual(acl.has('user', 'resource-A', 'read'), true, 'A user should have access to read resource A')
        })

        await sub.test('A guest can read resource A', () =>
        {
          assert.strictEqual(acl.has('guest', 'resource-A', 'read'), true, 'A guest should have access to read resource A')
        })
      })

      await sub.test('An admin can create resource A', async sub =>
      {
        assert.strictEqual(acl.has('admin', 'resource-A', 'create'), true, 'An admin should have access to create resource A')

        await sub.test('A user can create resource A', () =>
        {
          assert.strictEqual(acl.has('user', 'resource-A', 'create'), true, 'A user should have access to create resource A')
        })

        await sub.test('A guest can not create resource A', () =>
        {
          assert.strictEqual(acl.has('guest', 'resource-A', 'create'), false, 'A guest should not have access to create resource A')
        })
      })
    })

    test('Can use descendants wildcards to check permissions', async sub =>
    {
      const acl = new WildTrie()

      acl.add('admin', '*', '*', '*', '*', '*')
      acl.add('user', 'users', 'settings', 'personal', 'read')
      acl.add('user', 'users', 'settings', 'personal', 'avatar', 'update')

      const assert = contextualAssert({ acl })

      await sub.test('An admin has permissions', async sub =>
      {
        assert.strictEqual(acl.has('admin', '**'), true, 'An admin should have permissions')

        await sub.test('A user has permissions', () =>
        {
          assert.strictEqual(acl.has('user', '**'), true, 'A user should have permissions')
        })

        await sub.test('A guest has no permissions', () =>
        {
          assert.strictEqual(acl.has('guest', '**'), false, 'A guest should not have permissions')
        })
      })

      await sub.test('An admin can read its personal settings', async sub =>
      {
        assert.strictEqual(acl.has('admin', 'users', 'settings', 'personal', 'read'), true, 'An admin should have access to read its personal settings')

        await sub.test('A user can read its personal settings', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'settings', 'personal', 'read'), true, 'A user should have access to read its personal settings')
        })

        await sub.test('A guest can not read users settings', () =>
        {
          assert.strictEqual(acl.has('guest', 'users', 'settings', 'personal', 'read'), false, 'A guest should not have access to read users settings')
        })
      })

      await sub.test('An admin can read all users settings', async sub =>
      {
        assert.strictEqual(acl.has('admin', 'users', 'settings', 'all', 'read'), true, 'An admin should have access to read all users settings')

        await sub.test('A user can not read all users settings', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'settings', 'all', 'read'), false, 'A user should not have access to read all users settings')
        })
      })

      await sub.test('An admin can read something', async sub =>
      {
        assert.strictEqual(acl.has('admin', '**', 'read'), true, 'An admin should have access to read something')

        await sub.test('A user can read something', () =>
        {
          assert.strictEqual(acl.has('user', '**', 'read'), true, 'A user should have access to read something')
        })

        await sub.test('A user can read som personal settings', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'settings', 'personal', '**', 'read'), true, 'A user should have access to read some personal settings')
        })

        await sub.test('A user can update some of its personal settings', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'settings', 'personal', '**', 'update'), true, 'A user should have access to update some of its personal settings')
        })
      })

      await sub.test('An admin can delete something', async sub =>
      {
        assert.strictEqual(acl.has('admin', '**', 'delete'), true, 'An admin should have access to update something')

        await sub.test('A user can not delete something', () =>
        {
          assert.strictEqual(acl.has('user', '**', 'delete'), false, 'A user should not have access to delete something')
        })
      })
    })

    test('Can use descendants wildcards to add permissions', async sub =>
    {
      const acl = new WildTrie()

      acl.add('admin', '**')
      acl.add('user', 'users', 'settings', 'personal', '**', 'read')

      const assert = contextualAssert({ acl })

      await sub.test('An admin has access to read personal settings', async sub =>
      {
        assert.strictEqual(acl.has('admin', 'users', 'settings', 'personal', 'read'), true, 'An admin should have access to read personal settings')

        await sub.test('A user has access to read personal settings', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'settings', 'personal', 'read'), true, 'A user should have access to read personal settings')
        })

        await sub.test('A user has access to read nested personal settings', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'settings', 'personal', 'foo', 'read'), true, 'A user should have access to read nested personal settings')
        })

        await sub.test('A user has access to read multiple nested personal settings', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'settings', 'personal', 'foo', 'bar', 'read'), true, 'A user should have access to read multiple nested personal settings')
        })

        await sub.test('A user can not read all settings', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'settings', 'all', 'update'), false, 'A user should not have access to read all settings')
        })

        await sub.test('A user can not update personal settings', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'settings', 'personal', 'update'), false, 'A user should not have access to update personal settings')
        })

        await sub.test('A user can not update nested personal settings', () =>
        {
          assert.strictEqual(acl.has('user', 'users', 'settings', 'personal', 'foo', 'update'), false, 'A user should not have access to update nested personal settings')
        })
      })
    })

    test('Can delete branches from the WildTrie', async (sub) =>
    {
      const acl = new WildTrie()

      acl.add('admin', 'users', 'read')
      acl.add('admin', 'users', 'create')
      acl.add('user',  'users', 'read')

      const assert = contextualAssert({ acl })

      assert.strictEqual(acl.has('admin', 'users', 'read'),   true, 'Admin should initially have read access')
      assert.strictEqual(acl.has('admin', 'users', 'create'), true, 'Admin should initially have create access')

      await sub.test('Deleting a specific permission', () =>
      {
        const mutated = acl.delete('admin', 'users', 'read')
        assert.strictEqual(mutated, true, 'Delete should return true when a branch is removed')
        assert.strictEqual(acl.has('admin', 'users', 'read'),  false, 'Admin should no longer have read access')
        assert.strictEqual(acl.has('admin', 'users', 'create'), true, 'Admin should still have create access')
      })

      await sub.test('Deleting a specific resource', () =>
      {
        const
          preMutationSize = acl.size,
          mutated         = acl.delete('admin', 'users')

        assert.strictEqual(mutated, true, 'Should return true when deleting "admin.users" branch')
        assert.strictEqual(acl.get('admin').has('users'), false, '"admin.users" branch should have been removed')
        assert.strictEqual(acl.size, preMutationSize - 2, 'Size should have decreased by 2 nodes ("admin.users" and "admin.users.create")')
      })

      await sub.test('Deleting with no path does nothing', () =>
      {
        const
          preMutationSize = acl.size,
          mutated         = acl.delete()

        assert.strictEqual(mutated, false, 'Should return false when deleting with no path')
        assert.strictEqual(acl.has('user',  'users', 'read'), true, 'User should still have read access')
        assert.strictEqual(acl.size, preMutationSize, 'All branches should stay the same')
      })

      await sub.test('Clear all descendant nodes', () =>
      {
        const preMutationSize = acl.size
        acl.clear()

        assert.notEqual(acl.size, preMutationSize, 'Expected to mutate size')
        assert.strictEqual(acl.size, 0, 'Only the root node should remain')
        assert.strictEqual(acl.has('user', 'users', 'read'), false, 'User should still not have read access')
      })
    })

    test('Can reference a shared trie', async sub =>
    {
      const 
        groups  = new WildTrie(),
        creator = groups.add('creator'),
        editor  = groups.add('editor'),
        cleaner = groups.add('cleaner'),
        reader  = groups.add('reader')

      creator.set('editor',  editor) .set('reader', reader)
      creator.set('cleaner', cleaner).set('reader', reader)

      const assert = contextualAssert({ groups })

      await sub.test('A creator references an editor', async sub =>
      {
        assert.strictEqual(groups.has('creator', '**', 'editor'), true, 'A creator should reference an editor')
      })

      await sub.test('A creator references a cleaner', async sub =>
      {
        assert.strictEqual(groups.has('creator', '**', 'cleaner'), true, 'A creator should reference a cleaner')
      })

      await sub.test('A creator references a reader', async sub =>
      {
        assert.strictEqual(groups.has('creator', '**', 'reader'), true, 'A creator should reference a reader')
      })

      await sub.test('An editor references a reader', async sub =>
      {
        assert.strictEqual(groups.has('editor', '**', 'reader'), true, 'An editor should reference a reader')
      })

      await sub.test('A cleaner references a reader', async sub =>
      {
        assert.strictEqual(groups.has('cleaner', '**', 'reader'), true, 'A cleaner should reference a reader')
      })

      await sub.test('A reader does not reference an editor', () =>
      {
        assert.strictEqual(groups.has('reader', '**', 'editor'), false, 'A reader should not reference an editor')
      })

      await sub.test('A reader does not reference a cleaner', () =>
      {
        assert.strictEqual(groups.has('reader', '**', 'cleaner'), false, 'A reader should not reference a cleaner')
      })

      await sub.test('A reader does not reference a creator', () =>
      {
        assert.strictEqual(groups.has('reader', '**', 'creator'), false, 'A reader should not reference a creator')
      })

      await sub.test('An editor does not reference a creator', () =>
      {
        assert.strictEqual(groups.has('editor', '**', 'creator'), false, 'An editor should not reference a creator')
      })

      await sub.test('An editor does not reference a cleaner', () =>
      {
        assert.strictEqual(groups.has('editor', '**', 'cleaner'), false, 'An editor should not reference a cleaner')
      })

      await sub.test('A cleaner does not reference a creator', () =>
      {
        assert.strictEqual(groups.has('cleaner', '**', 'creator'), false, 'A cleaner should not reference a creator')
      })

      await sub.test('A cleaner does not reference an editor', () =>
      {
        assert.strictEqual(groups.has('cleaner', '**', 'editor'), false, 'A cleaner should not reference an editor')
      })
    })
  })

  suite('Transform', () =>
  {
    const acl = new WildTrie()

    acl.add('admin', 'users', 'read')
    acl.add('admin', 'users', 'create')
    acl.add('user',  'users', 'read')

    const assert = contextualAssert({ acl })

    test('Can use toJSON', () =>
    {
      const json = acl.toJSON()

      assert.ok(json?.admin?.users.read,    'An admin should have access to read users')
      assert.ok(json?.admin?.users.create,  'An admin should have access to create users')
      assert.ok(json?.user?.users.read,     'A user should have access to read users')
    })

    test('Can use toString', () =>
    {
      const string = acl.toString()

      assert.includes(string.split('\n'), '├─ admin',         'The string representation should include "├─ admin"')
      assert.includes(string.split('\n'), '│  └─ users',      'The string representation should include "│  └─ users"')
      assert.includes(string.split('\n'), '│     ├─ read',    'The string representation should include "│     ├─ read"')
      assert.includes(string.split('\n'), '│     └─ create',  'The string representation should include "│     └─ create"')
      assert.includes(string.split('\n'), '└─ user',          'The string representation should include "└─ user"')
      assert.includes(string.split('\n'), '   └─ users',      'The string representation should include "   └─ users"')
      assert.includes(string.split('\n'), '      └─ read',    'The string representation should include "      └─ read"')
    })
  })
})