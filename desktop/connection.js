document.querySelector("#form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const result = await window.connection.connect(
    document.querySelector("#url").value,
  );
  document.querySelector("#error").textContent = result?.error || "";
});
