// Take private/index.html, encrypt it, insert as a blob in src/index.html, and save to dist/

const password = (await Bun.file("private/encryption_password").text()).trim().toLowerCase();

async function encryptContent(content: string, password: string): Promise<string> {
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
    return encryptedBase64;
}

let private_html = await Bun.file("private/index.html").text();

// First, transform private_html by inlining images
const venue_photo = await Bun.file("private/venue_photo.jpeg").arrayBuffer();
const venue_photo_base64 = btoa(String.fromCharCode(...new Uint8Array(venue_photo)));
private_html = private_html.replace("<!-- VENUE_IMAGE_URL -->", `data:image/jpeg;base64,${venue_photo_base64}`);

// Then, encrypt the transformed private_html
const encrypted_private_html = await encryptContent(private_html, password);

// Insert the encrypted private HTML into the public index.html content
const publicContent = await Bun.file("src/index.html").text();
const updatedContent = publicContent.replace("<!-- ENCRYPTED_CONTENT -->", encrypted_private_html);
await Bun.write("dist/web/index.html", updatedContent);

const files_to_copy = ["engagement-photo.jpg"];
for (const file of files_to_copy) {
    await Bun.write(`dist/web/${file}`, await Bun.file(`src/${file}`).arrayBuffer());
}
