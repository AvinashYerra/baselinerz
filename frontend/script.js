document.getElementById("scanBtn").addEventListener("click", async () => {
  const url = document.getElementById("repoUrl").value;
  const res = await fetch("/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl: url })
  });
  const data = await res.json();
  document.getElementById("score").innerText = `Score: ${data.score}%`;

  let table = "<tr><th>Feature</th><th>File</th><th>Line</th><th>Status</th></tr>";
  data.features.forEach(f => {
    table += `<tr><td>${f.name}</td><td>${f.file}</td><td>${f.line}</td><td>${f.status}</td></tr>`;
  });
  document.getElementById("results").innerHTML = table;
});
