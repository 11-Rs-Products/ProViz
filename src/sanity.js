import { createClient } from '@sanity/client';

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';
const token = import.meta.env.VITE_SANITY_TOKEN; // Required for mutations (saving users)

let client = null;

if (projectId) {
    client = createClient({
        projectId: projectId,
        dataset: dataset,
        useCdn: false, // set to false if we want fresh data always
        apiVersion: '2023-10-01',
        token: token,
    });
}

/**
 * Fetches all questions from Sanity.
 * Assumes a Sanity schema named "question" with fields: title, description, initialCode, setupSceneJson
 */
export async function fetchQuestions() {
    if (!client) {
        console.warn("Sanity client not configured. Falling back to empty questions array.");
        return [];
    }

    try {
        const query = `*[_type == "question"] | order(_createdAt asc) {
            _id,
            title,
            description,
            initialCode,
            setupSceneJson
        }`;
        const sanityQuestions = await client.fetch(query);
        
        // Map Sanity questions to our internal format
        return sanityQuestions.map(q => {
            let parsedSetup = [];
            try {
                if (q.setupSceneJson) {
                    parsedSetup = JSON.parse(q.setupSceneJson);
                }
            } catch(e) {
                console.error("Failed to parse setupSceneJson for question:", q.title);
            }

            return {
                id: q._id,
                title: q.title || "Untitled",
                description: q.description || "",
                initialCode: q.initialCode || "",
                setupScene: (vAPI) => {
                    vAPI.clearAll();
                    // Play back the JSON setup instructions
                    parsedSetup.forEach(action => {
                        if (action.type === 'spawn') {
                            vAPI.spawn(action.id, action.val, action.color || 'DEFAULT', action.x || 0, action.y || 0, action.z || 0);
                        }
                    });
                }
            };
        });
    } catch (e) {
        console.error("Error fetching questions from Sanity:", e);
        return [];
    }
}

/**
 * Saves a user's email to Sanity.
 * Assumes a Sanity schema named "user" with an "email" field.
 */
export async function saveUserEmail(email) {
    if (!client || !token) {
        console.warn("Sanity client or token not configured. Skipping saving user email.");
        return;
    }
    
    try {
        // Check if user already exists
        const existingUser = await client.fetch(`*[_type == "user" && email == $email][0]`, { email });
        
        if (!existingUser) {
            await client.create({
                _type: 'user',
                email: email
            });
            console.log("Saved new user email to Sanity:", email);
        }
    } catch (e) {
        console.error("Error saving user email to Sanity:", e);
    }
}
