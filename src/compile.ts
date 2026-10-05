// Take private/index.html, encrypt it, insert as a blob in src/index.html, and save to dist/

const password = (await Bun.file("private/encryption_password").text()).trim().toLowerCase();
const content = await Bun.file("private/index.html").text();

const encrypted = await crypto.subtle.encrypt(
    {
        name: "AES-GCM",
        iv: new TextEncoder().encode("wedding-website-random-iv"),
        additionalData: new TextEncoder().encode("Additional data used to verify decryption")
    },
    await crypto.subtle.importKey(
        "raw",
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password)),
        "AES-GCM",
        false,
        ["encrypt"]
    ),
    new TextEncoder().encode(content)
);
const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

const publicContent = await Bun.file("src/index.html").text();
const updatedContent = publicContent.replace("<!-- ENCRYPTED_CONTENT -->", encryptedBase64);
await Bun.write("dist/web/index.html", updatedContent);

const files_to_copy = ["engagement-photo.jpg"];
for (const file of files_to_copy) {
    await Bun.write(`dist/web/${file}`, await Bun.file(`src/${file}`).arrayBuffer());
}
