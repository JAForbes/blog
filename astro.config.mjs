import { defineConfig } from 'astro/config';
import { visit } from "unist-util-visit"

export default defineConfig({
    site: 'https://james-forbes.com',
    markdown: {
        remarkPlugins: [
            () => tree => {
                visit(tree, "code", node => {
                    if (node.lang !== 'mermaid') {return;}

                    let newNode = node
                    newNode.type = "html"
                    newNode.value = `
                    <pre class="mermaid">
                        ${newNode.value}
                    </pre>
                    `
                })
            }
        ]
    }
});
