import { ParseTreeResult } from "@angular/compiler";

export default function traverseTemplate(ast: ParseTreeResult, vistor: (n: any) => void) {
  const templateNodes = ast.rootNodes;

  const traverse = (node: any, vistor: (n: any) => void) => {
    if (node.children) {
      node.children.forEach(child => {
        child.parent = node
        traverse(child, vistor);
      });
    }
    vistor(node);
  };

  templateNodes?.forEach(node => {
    traverse(node, vistor);
  });
}
