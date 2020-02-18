var treeHolder = document.getElementById("plain-tree");

var dndTree = new Bonsai(treeHolder, {
  hier: pages,
  content: function (node) {
    return document.createTextNode(node.id + " tree item");
  },
  order: function(a, b) {
    return a.order - b.order ? a.order - b.order : a.id - b.id;
  },
  transform: function(idx, rest) {
    rest.order = idx + 1;
    return rest;
  }
});

var getTree = () => {
  var hier = dndTree.getHier();
  var treeObj = dndTree.getTreeObj(hier);
  var treeHolderTest = document.getElementById("plain-tree-test");
  while (treeHolderTest.firstChild) {
    treeHolderTest.firstChild.remove();
  }
  dndTree.buildTree(treeHolderTest, treeObj[null].children);
  document.querySelector("#equals").value =
    treeHolderTest.innerHTML === treeHolder.innerHTML;
};

var button = document.getElementById("get-tree");

button.addEventListener("click", getTree);
