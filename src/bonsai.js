class Bonsai {
  constructor(treeHolder, { hier, content, order, transform }) {
    this.order = order || ((a, b) => (a.id > b.id) - (a.id < b.id));
    this.content = content;
    this.treeHolder = treeHolder;
    this.transform = transform;
    if (hier) {
      this.nodes = this.getTreeObj(hier);
      treeHolder.addEventListener("click", this.toggle, false);
      this.buildTree(treeHolder, this.nodes[null].children);
      this.dnd();
    }
  }

  toggle = ({ target }) => {
    target.classList.contains("tree-node") &&
      target.children.length &&
      target.classList.toggle("closed");
  };

  getTreeObj = hier => {
    const nodes = {};
    const rootNode = {
      id: null,
      children: []
    };

    nodes[null] = rootNode;
    hier.forEach(({ id, parentId, ...rest }) => {
      nodes[id] = {
        id,
        parentId,
        ...rest,
        children: []
      };
    });

    hier.forEach(({ id, parentId }) => {
      nodes[parentId].children.push(nodes[id]);
    });

    Object.values(nodes).forEach(node => node.children.sort(this.order));

    return nodes;
  };

  treeNode = ({ id, ...rest }) => {
    const li = document.createElement("li");
    li.appendChild(this.content({ id, ...rest }));
    li.dataset.id = id;
    li.draggable = "true";
    li.classList.add("tree-node", "droppable");
    return li;
  };

  tree = () => {
    const ol = document.createElement("ol");
    ol.classList.add("tree");
    return ol;
  };

  buildTree = (parent, nodes) => {
    if (!nodes || !nodes.length) {
      return;
    }
    const ol = this.tree();
    parent.classList.add("parent");
    nodes.forEach(({ children, ...rest }) => {
      const li = this.treeNode(rest);
      ol.appendChild(li);
      this.buildTree(li, children);
    });
    parent.appendChild(ol);
  };

  getHier = () => {
    const hier = [];
    const data = this.nodes[null].children;
    const loop = (data, parentId) => {
      data.forEach(({ id, children, ...rest }, index) => {
        rest = this.transform ? this.transform(index, rest) : rest;
        hier.push({
          id,
          parentId,
          ...rest
        });
        if (children) {
          return loop(children, id);
        }
      });
    };
    loop(data, null);
    hier.sort((a, b) => (a.id > b.id) - (a.id < b.id));
    return hier;
  };

  dnd = () => {
    const self = this;
    self.draggedEl = null;

    function coords(e) {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return {
        x,
        y
      };
    }

    const pos = el => Array.from(el.parentNode.children).indexOf(el);

    const move = (id, destParentId, index) => {
      const node = self.nodes[id];
      const origParentId = node.parentId;
      node.parentId = destParentId;
      const oldSiblings = self.nodes[origParentId].children;
      const oldIdx = oldSiblings.indexOf(node);
      oldSiblings.splice(oldIdx, 1);
      const newSiblings = self.nodes[destParentId].children;
      newSiblings.splice(index, 0, node);
    };

    function handleDragStart(e) {
      const { target } = e;
      self.draggedEl = target;

      const setClasses = () => {
        target.classList.contains("parent") && target.classList.add("closed");
        target.classList.add("dragged");
      };

      setTimeout(setClasses, 0);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", target.dataset.id);
    }

    function handleDragEnter(e) {
      e.stopPropagation();
      e.preventDefault();
      const { target } = e;

      if (
        target &&
        target.classList &&
        target.classList.contains("tree-node")
      ) {
        const sibling =
          target.previousElementSibling === self.draggedEl ||
          target.nextElementSibling === self.draggedEl;

        const { classList } = target;
        const { y } = coords(e);
        const ratio = y / target.offsetHeight;

        if (ratio < 0.1 && !sibling) {
          classList.remove("over", "over-bottom");
          classList.add("over-top");
        } else if (ratio > 0.9 && !sibling) {
          classList.remove("over", "over-top");
          classList.add("over-bottom");
        } else {
          classList.remove("over-top", "over-bottom");
          classList.add("over");
        }
      }
    }

    function handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      return false;
    }

    function handleDragLeave(e) {
      e.preventDefault();
      e.stopPropagation();
      const { target } = e;
      target &&
        target.classList &&
        target.classList.remove("over", "over-bottom", "over-top");
    }

    function handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      const { target } = e;
      if (
        self.draggedEl === target ||
        self.draggedEl.contains(target) ||
        !target.classList.contains("droppable")
      ) {
        return false;
      }

      const id = self.draggedEl.dataset.id;
      const targetId = target.dataset.id;

      const parent = self.draggedEl.parentElement;
      if (parent.children.length === 1) {
        parent.closest(".parent").classList.remove("parent");
        parent.remove();
      }

      if (target.classList.contains("over-top")) {
        target.insertAdjacentElement("beforebegin", self.draggedEl);
        const index = pos(self.draggedEl);
        move(id, self.nodes[targetId].parentId, index);
        self.draggedEl = null;
        return false;
      }

      if (target.classList.contains("over-bottom")) {
        target.insertAdjacentElement("afterend", self.draggedEl);
        const index = pos(self.draggedEl);
        move(id, self.nodes[targetId].parentId, index);
        self.draggedEl = null;
        return false;
      }

      target.classList.add("parent");
      let newTree = false;
      const ol =
        target.querySelector(".tree") || ((newTree = true) && self.tree());
      ol.appendChild(self.draggedEl);
      const index = pos(self.draggedEl);
      move(id, targetId, index);
      newTree && target.appendChild(ol);
      self.draggedEl = null;

      return false;
    }

    function handleDragEnd(e) {
      e.preventDefault();
      const { target } = e;
      target.classList.remove("dragged");
      ["over", "over-top", "over-bottom"].forEach(arg => {
        document
          .querySelectorAll(`.${arg}`)
          .forEach(el => el.classList.remove(arg));
      });
    }

    self.treeHolder.addEventListener("dragstart", handleDragStart, false);
    self.treeHolder.addEventListener("dragenter", handleDragEnter, false);
    self.treeHolder.addEventListener("dragover", handleDragOver, false);
    self.treeHolder.addEventListener("dragleave", handleDragLeave, false);
    self.treeHolder.addEventListener("drop", handleDrop, false);
    self.treeHolder.addEventListener("dragend", handleDragEnd, false);
  };
}

window.Bonsai = Bonsai;
