// Take private/index.html, encrypt it, insert as a blob in src/index.html, and save to dist/

const password = (await Bun.file("private/encryption_password").text()).trim().toLowerCase();

async function inline(private_html: string, key: string, filepath: string): Promise<string> {
    const fileBuffer = await Bun.file(filepath).arrayBuffer();
    const fileBase64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    // If the key does not exist
    if (!private_html.includes(`<!-- ${key} -->`)) {
        console.warn(`Warning: Key ${key} not found in private HTML.`);
    }
    return private_html.replaceAll(`<!-- ${key} -->`, `data:image/jpeg;base64,${fileBase64}`);
}

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
    const encryptedBase64 = Buffer.from(encrypted).toString("base64");;
    return encryptedBase64;
}

let private_html = await Bun.file("private/index.html").text();

// First, transform private_html by inlining images
private_html = await inline(private_html, "VENUE_IMAGE_URL", "private/venue_photo.jpeg");
private_html = await inline(private_html, "ENGAGEMENT_PHOTO_1_URL", "private/engagement-photo-1.jpeg");
private_html = await inline(private_html, "ENGAGEMENT_PHOTO_2_URL", "private/engagement-photo-2.jpeg");

// Then, encrypt the transformed private_html
const encrypted_private_html = await encryptContent(private_html, password);

// Insert the encrypted private HTML into the public index.html content
let publicContent = await Bun.file("src/index.html").text();
publicContent = publicContent.replace("<!-- ENCRYPTED_CONTENT -->", encrypted_private_html);
// publicContent = await inline(publicContent, "ENGAGEMENT_PHOTO_1_URL", "private/engagement-photo-1.jpeg");
await Bun.write("dist/web/index.html", publicContent);
