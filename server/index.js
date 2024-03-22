'use strict';

const express = require('express');
const morgan = require('morgan'); // log messages middleware
const { check, validationResult } = require('express-validator'); // validation middleware
const dao = require('./dao'); // module for accessing the DB
const cors = require('cors');

const session = require('express-session'); // enable sessions


// init express
const app = express();
const port = 3001;

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('./public')); //per le immagini degli accessori



const corsOptions = {

    origin: 'https://gnam.eu.loclx.io',
    //origin: 'http://localhost:5173',
    credentials: true
};
app.use(cors(corsOptions));


/*** APIs ***/

/*          USER            */

// GET /api/user
app.get('/api/user', (req, res) => {
    dao.getUser()
        .then((user) => {
            res.json(user);
        })
        .catch(() => {
            res.status(500).end();
        });
});


// POST /api/user/selectitem
app.post('/api/user/selectitem', async (req, res) => {

    try {

        //     Controllo se l'item è stato sbloccato o meno
        /*const isUnlocked = await dao.isItemUnlocked(req.body);
        if (isUnlocked === false) {
            return res.status(403).json("The selected item is still locked!");
        }*/
        console.log(req.body)
        const result = await dao.selectItem(req.body);

        return res.status(201).json(`Item ${req.body} selected!`);  //uso result.length per ritornare quante righe ho modificato, 1 per ogni volta che si esegue la query
        //o req-body.item.id??

    } catch (err) {
        console.log(err);
        res.status(500).end();
    }

});




/*          FEED-ME          */
// nel body avrò la stringa con il nome del piatto (QrCode) --> req.body.food


// POST /api/feedme
app.post('/api/feedme', async (req, res) => {

    try {
        console.log(req.body.food);

        const checkedFood = await dao.checkFood(req.body.food);

        console.log("Checked Food" + checkedFood);
        console.log("Checked Food.is_good" + checkedFood.is_good);
        console.log("Checked Food.feedback" + checkedFood.feedback);


        if (checkedFood.is_good == true) {
            await dao.earnExp({ exp: 5 });
            await dao.earnCoins({ coins: 30 });

        } else {
            await dao.earnExp({ exp: 1 });
            await dao.earnCoins({ coins: 2 });
        }

        //controllo nuovo livello
        const isNewLevel = await dao.isNewLevel();

        if (isNewLevel === true) {
            const result = await dao.newLevel();
        }

        const tip = await dao.getLockedTip();

        if (tip !== undefined) {
            await dao.unlockTip(tip);
            const response = { is_good: checkedFood.is_good, feedback: checkedFood.feedback, tip: tip };
            res.json(response);

        } else {

            const tip = {
                description: "You have unlocked all the Tips, go check them!"
            }
            const response = { is_good: checkedFood.is_good, feedback: checkedFood.feedback, tip: tip };
            res.json(response);
        }




    } catch (err) {
        console.log(err);
        res.status(500).end();
    }
});


// POST /api/feedme/goals

app.post('/api/feedme/goals', async (req, res) => {

    try {

        //Riduco a prescindere il numero di trials
        await dao.reduceTrials();

        //controllo se il piatto caricato serve per completare un goal
        const changes1 = await dao.increaseSuccess(req.body.food);
        console.log(changes1);

        //controllo se ho completato un goal (al momento non importa se con successo o meno)
        const changes2 = await dao.setGoalsFinished();

        const anyGoalCompleted = await dao.isAnyGoalCompleted();
        res.json(anyGoalCompleted);

    } catch (err) {
        console.log(err);
        res.status(500).end();
    }

});


// POST /api/feedme/international

app.post('/api/feedme/international', async (req, res) => {
    try {

        //il piatto internazionale è stato cucinato -> non è più new
        await dao.cookInternationalDish(req.body.food);

        //Prendo l'id dell'oggetto che ho sbloccato cucinando il piatto internazionale
        const id_international_item = await dao.getInternationalItemId(req.body.food);



        if (id_international_item !== undefined) {

            console.log("OK id_international_item " + id_international_item.item_id);
            await dao.unlockInternationalItem({ id: id_international_item.item_id });

            const result = await dao.setInternationalDishCompleted(req.body.food);
            res.status(201).json(result);

        } else {
            res.status(204).json(false);
        }

    } catch (err) {
        console.log(err);
        res.status(500).end();
    }
});


//POST /api/goals/checkresults

app.post('/api/goals/checkresults', async (req, res) => {
    try {

        const successfullyCompleted = await dao.isGoalSuccessfullyCompleted(req.body.goal);

        console.log(successfullyCompleted)

        if (successfullyCompleted.exists) {
            // deseleziona goal
            await dao.deselectGoal(req.body.goal);
            //Incrementa exp e coins che quel goal da + controllo nuovo livello

            await dao.earnExp({ exp: successfullyCompleted.exp });
            await dao.earnCoins({ coins: successfullyCompleted.coins });

            const isNewLevel = await dao.isNewLevel();

            if (isNewLevel === true) {
                const result = await dao.newLevel();
                console.log("result " + result);
            }
        } else {
            //resetta goal
            console.log(req.body.goal)
            const changes = await dao.resetGoal(req.body.goal);
            console.log(changes);
        }

        res.json({ successfullyCompleted: successfullyCompleted.exists });

    } catch (err) {
        console.log(err);
        res.status(500).end();
    }
});


/*          ITEMS           */

// GET /api/items
app.get('/api/items', (req, res) => {
    dao.getItems()
        .then(list => res.json(list))
        .catch(() => res.status(500).end());
});


/*          TIPS            */

// GET /api/tips
app.get('/api/tips', (req, res) => {
    dao.getTips()
        .then(list => res.json(list))
        .catch(() => res.status(500).end());
});


/*          GOALS           */

// GET /api/goals
app.get('/api/goals', (req, res) => {
    dao.getGoals()
        .then(list => res.json(list))
        .catch(() => res.status(500).end());
});



app.get('/api/goalbyid/:goalToSend', (req, res) => {
    dao.getGoalById(req.params.goalToSend)
        .then(goal => res.json(goal))
        .catch(() => res.status(500).end());
});


//POST /api/selectgoal
app.post('/api/selectgoal', async (req, res) => {

    try {

        const result = await dao.selectGoal(req.body.goal);
        return res.status(201).json(`Goal ${req.body.goal} selected!`);

    } catch (err) {
        console.log(err);
        res.status(500).end();
    }

});

//api per resettare il goal
app.post('/api/disactivegoal', async (req, res) => {

    try {

        const result = await dao.resetGoal(req.body.goal);
        return res.status(201).json(`Goal ${req.body.goal.id} disactivated!`);

    } catch (err) {
        console.log(err);
        res.status(500).end();
    }

});

/*   INTERNATIONAL DISHES   */

// GET /api/internationaldishes
app.get('/api/internationaldishes', (req, res) => {
    dao.getInternationalDishes()
        .then(list => res.json(list))
        .catch(() => res.status(500).end());
});

// GET /api/internationaldishes/:dishId
app.get('/api/internationaldishes/:dishId', (req, res) => {
    dao.getInternationalDishById(req.params.dishId)
        .then(dish => res.json(dish))
        .catch(() => res.status(500).end());
});


/*          SHOP         */

// POST /api/shop/buy
app.post('/api/shop/buy', async (req, res) => {
    console.log(req.body)
    try {

        //     Controllo se l'item è stato sbloccato o meno (non dovrebbe servire visto che bloccato da frontend)
        /*const isUnlocked = await dao.isItemUnlocked(req.body);
        if (isUnlocked === false) {
            return res.status(403).json("The selected item is still locked!");
        }*/

        //non inserisco controlli per controllare i soldi, per simulazione basta disattivare il pulsante da frontend
        await dao.payCoins(req.body);

        const result = await dao.buyItem(req.body);

        return res.status(201).json(`Item ${req.body.name} bought!`);

    } catch (err) {
        console.log(err);
        res.status(500).end();
    }

});


// POST /api/user/personalize
app.post('/api/user/personalize', async (req, res) => {

    try {

        await dao.selectItem(req.body.item);

        return res.status(201).json('Skin updated with ${req.body.item.name}!');

    } catch (err) {
        console.log(err);
        res.status(500).end();
    }

});


// POST /api/spin
app.post('/api/spin', async (req, res) => {
    try {

        console.log("SPIN SERVER")
        //non inserisco controlli per controllare i soldi, per simulazione basta disattivare il pulsante da frontend
        await dao.payCoins({ coins: 300 });

        const dishToUnlock = await dao.getInternationalDish();

        const result = await dao.unlockInternationaDish(dishToUnlock);

        return res.status(201).json(dishToUnlock);

    } catch (err) {
        console.log(err);
        res.status(500).end();
    }

});


/*      Daily Meal      */

// GET /api/dailymeal
app.get('/api/dailymeal', (req, res) => {
    dao.getDailyMeal()
        .then(list => res.json(list))
        .catch(() => res.status(500).end());
});






// activate the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
