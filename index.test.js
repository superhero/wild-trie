import WildTrie         from '@superhero/wild-trie'
import contextualAssert from '@superhero/audit/assert/contextual'
import { suite, test }  from 'node:test'

suite('@superhero/wild-trie', () =>
{
  suite('Can use the WildTrie class to structure an ACL instance', () =>
  {
    test('Can use the WildTrie class to structure a basic ACL instance', async sub =>
    {
      const acl = new WildTrie()

      acl.declare('admin', 'users', 'read')
      acl.declare('admin', 'users', 'create')
      acl.declare('user',  'users', 'read')

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

      acl.declare('admin', '*', '*')

      acl.declare('user', 'users', 'read')
      acl.declare('user', 'resource-A', '*')

      acl.declare('guest', 'resource-A', 'read')

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

      acl.declare('admin', '*', '*', '*', '*', '*')
      acl.declare('user', 'users', 'settings', 'personal', 'read')
      acl.declare('user', 'users', 'settings', 'personal', 'avatar', 'update')

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

    test('Can use descendants wildcards to declare permissions', async sub =>
    {
      const acl = new WildTrie()

      acl.declare('admin', '**')
      acl.declare('user', 'users', 'settings', 'personal', '**', 'read')

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

    test('Can reference a shared trie', async sub =>
    {
      const 
        groups  = new WildTrie(),
        creator = groups.declare('creator'),
        editor  = groups.declare('editor'),
        cleaner = groups.declare('cleaner'),
        reader  = groups.declare('reader')

      creator.reference('editor',   editor)
             .reference('cleaner',  cleaner)

      editor.reference('reader', reader)

      cleaner.reference('reader', reader)

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

    acl.declare('admin', 'users', 'read')
    acl.declare('admin', 'users', 'create')
    acl.declare('user',  'users', 'read')

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