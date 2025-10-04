import fetch from "node-fetch";

export async function fetchCssFilesFromRepo(repoUrl) {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return [];
    const [, user, repo] = match;

    const cssFiles = [];

    // Recursive function to traverse repo contents
    async function traverseFolder(path = "") {
        const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
        console.log(apiUrl);
        const res = await fetch(apiUrl);
        const files = await res.json();

        for (const file of files) {
            console.log(file);
            if (file.type === "file" && file.name.endsWith(".css")) {
                console.log(file);
                // Fetch file content
                const rawRes = await fetch(file.download_url);
                const content = await rawRes.text();
                cssFiles.push({ name: file.path, content }); // include full path
            } else if (file.type === "dir") {
                // Recurse into subdirectory
                await traverseFolder(file.path);
            }
        }
    }

    await traverseFolder(); // start from root
    return cssFiles;
}
