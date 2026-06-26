const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all requests (useful if frontend and backend run on different ports)
app.use(cors());

// Serve the frontend static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Test database connection on startup
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connection test: SUCCESS');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection test: FAILED');
        console.error('Error Details:', err.message);
        console.log('\n👉 Please configure your MySQL credentials in the "ingredient-backend/.env" file.');
    });

// API Search Endpoint: /global/ingredients/search
app.get('/global/ingredients/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.json([]);
    }

    try {
        // 1. Fetch matching ingredients
        const [ingredients] = await pool.query(
            `SELECT id, name, rating, short_description AS description, details_url AS detailsUrl, has_details 
             FROM ingredients 
             WHERE name LIKE ? 
             LIMIT 50`,
            [`%${query}%`]
        );

        if (ingredients.length === 0) {
            return res.json([]);
        }

        // 2. Fetch details for matched ingredients
        const ingredientIds = ingredients.map(ing => ing.id);
        const [details] = await pool.query(
            `SELECT id, ingredient_id, main_title, pc_rating AS Rating, benefits AS Benefits, categories AS Categories, glance_title, description_title 
             FROM ingredient_details 
             WHERE ingredient_id IN (?)`,
            [ingredientIds]
        );

        if (details.length > 0) {
            const detailIds = details.map(d => d.id);

            // 3. Fetch glance points
            const [glancePoints] = await pool.query(
                `SELECT detail_id, text 
                 FROM ingredient_glance_points 
                 WHERE detail_id IN (?) 
                 ORDER BY point_index ASC`,
                [detailIds]
            );

            // Group glance points by detail_id
            const glancePointsMap = {};
            glancePoints.forEach(pt => {
                if (!glancePointsMap[pt.detail_id]) {
                    glancePointsMap[pt.detail_id] = [];
                }
                glancePointsMap[pt.detail_id].push(pt.text);
            });

            // 4. Fetch description paragraphs
            const [paragraphs] = await pool.query(
                `SELECT detail_id, text 
                 FROM ingredient_description_paragraphs 
                 WHERE detail_id IN (?) 
                 ORDER BY paragraph_index ASC`,
                [detailIds]
            );

            // Group paragraphs by detail_id
            const paragraphsMap = {};
            paragraphs.forEach(p => {
                if (!paragraphsMap[p.detail_id]) {
                    paragraphsMap[p.detail_id] = [];
                }
                paragraphsMap[p.detail_id].push(p.text);
            });

            // Group details by ingredient_id
            const detailsMap = {};
            details.forEach(det => {
                const glanceList = glancePointsMap[det.id] || [];
                const paraList = paragraphsMap[det.id] || [];

                const detailsObj = {
                    main_title: det.main_title,
                    Rating: det.Rating,
                    Benefits: det.Benefits,
                    Categories: det.Categories,
                    description_title: det.description_title,
                    Glance: glanceList.length > 0 ? [
                        {
                            title: det.glance_title || 'At a Glance',
                            details: glanceList
                        }
                    ] : [],
                    desp_details: paraList
                };

                if (!detailsMap[det.ingredient_id]) {
                    detailsMap[det.ingredient_id] = [];
                }
                detailsMap[det.ingredient_id].push(detailsObj);
            });

            // 5. Attach details array to each ingredient
            ingredients.forEach(ing => {
                ing.details = detailsMap[ing.id] || [];
            });
        } else {
            // Ensure every ingredient has a details array
            ingredients.forEach(ing => {
                ing.details = [];
            });
        }

        res.json(ingredients);
    } catch (err) {
        console.error('Error during search query:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Server only when running locally (e.g. `node server.js`)
// On Vercel, this file is imported as a serverless function, so we skip listen()
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
}

// Export the app so Vercel can use it as a serverless function
module.exports = app;