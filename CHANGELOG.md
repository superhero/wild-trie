---
#### v4.7.6
---

Version alignment...

---
#### v4.7.5
---

added the ability to assert a state type when inflating

---

added the ability to inflate a flat structure as a WilTrie instance

---

changed to use query ability in the keys/values/entries generators - to support wildcards

---

aligned the data structure to javascript Set and Map interfaces

---

bugfixed delete method

changed how the size of the trie is calculated

added a clear methid

---

improved the toJSON function

---

added the ability to construct a WildTrie instance from a provided constructor argument, or from the static 'from' method

---

altered the travesal methods to use generators

added travesal methods: leafs, leafValues, trail, trailValues and walk

removed methods: get and traverse
