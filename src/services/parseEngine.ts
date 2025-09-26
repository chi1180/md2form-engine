import remarkParse from "remark-parse";
import { unified } from "unified";
import { removePosition } from "unist-util-remove-position";

class ParseEngine {
  processor = unified().use(remarkParse);
  data: string;

  constructor(data: string) {
    this.data = data;
  }

  public async makeTree() {
    const parsedData = this.processor.parse(this.data);
    const tree = await this.processor.run(parsedData);
    removePosition(tree, { force: true });

    return tree;
  }
}

export { ParseEngine };
