import { getAuthTokenWithClientIdOnly } from "./oauth-linear";

async function main() {
  await getAuthTokenWithClientIdOnly()
  .then((token) => {
    console.log("Access Token:", token);
	return token;
  })
  .catch((err) => {
    console.error("Error during auth:", err);
  });
}

// npx tsx src/test-auth.ts
main();