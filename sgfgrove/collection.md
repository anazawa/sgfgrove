# SGFGrove.Colleciton

A SGF collection iterator/manipulator/visitor

## Synopsis

```js
// TBD
```

## Description

### Attributes

#### sequence
#### children
#### parent
#### index
#### depth

### Methods

#### width = getWidth()

#### height = getHeight()

#### nodes = getChildren()

#### nodes = getSiblings()

#### bool = isLeaf()

#### bool = isRoot()

Iterator for sequece:

#### node = getNext()

#### bool = hasNext()

#### node = peek()

#### node = getCurrent()

#### setCurrent( node )

#### depth = getCurrentDepth()

#### depth = getAbsoluteDepth()

Iterator for children:

#### node = getNextChild()

#### index = getCurrentIndex()

#### index = getAbsoluteIndex()

Array-like methods for sequence:

#### length = getLength()

#### nodes = slice( [start[, end]] )

#### push( node1, node2, ... )
#### push( [node1, node2, ...] )

#### node = pop()

#### node = shift()

#### unshift( node )


#### node = remove()

#### insert

## Author

Ryo Anazawa (anazawa@cpan.org)

## License

MIT

