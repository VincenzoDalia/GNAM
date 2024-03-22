"use strict"


const crypto = require('crypto');
const sqlite = require('sqlite3');
const db = new sqlite.Database("gnam.db", (err) => { if (err) throw err });

const port = 3001;



/*          USER            */


exports.getUser = () => {

    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM users WHERE id=1`;  //id = 1 perchè abbiamo un solo utente

        db.get(query, (err, row) => {

            if (err) {
                reject(err);
                return;

            } else {
                resolve(row);
            }
        });
    })
}


exports.selectItem = (item) => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE users SET item = ? WHERE id=1`;

        db.run(query, [item.name], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })
}

exports.earnExp = (obj) => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE users SET exp = exp + ? WHERE id = 1;`;

        db.run(query, [obj.exp], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })
}

exports.isNewLevel = () => {

    return new Promise((resolve, reject) => {
        const query = `SELECT count(*) as match FROM users WHERE id=1 AND exp >= 100`;

        db.get(query, [], (err, row) => {

            if (err) {
                reject(err);
                return;

            } else {
                //ritorno true se l'exp è >= 100, false altrimenti
                const isNewLevel = row.match > 0;
                resolve(isNewLevel);
            }
        });
    })

}


exports.newLevel = () => {

    return new Promise((resolve, reject) => {

        //uso %100 per fare in modo che l'exp non superi mai 100 
        //e che non si azzeri quando si raggiunge 100 (obiettivo mi da 23 exp, ne ho 99, ne guadagno 23, ne ho 22)

        const query = `UPDATE users SET exp = exp % 100, level = level + (exp/100) WHERE id=1`;

        db.run(query, [], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })
}

exports.earnCoins = (obj) => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE users SET coins = coins + ? WHERE id = 1;`;

        db.run(query, [obj.coins], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })
}

exports.payCoins = (obj) => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE users SET coins = coins - ? WHERE id = 1;`;

        db.run(query, [obj.coins], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })
}



/*          ITEMS          */


exports.getItems = () => {

    return new Promise((resolve, reject) => {
        const query = `SELECT *  FROM items`;

        db.all(query, (err, rows) => {

            if (err) {
                reject(err);
                return;

            } else {
                const list = rows.map((row) => ({
                    id: row.id,
                    name: row.name,
                    unlock_at: row.unlock_at, //0 o 1 
                    img: row.img,
                    bought: row.bought,
                    international: row.international,
                    skin: row.skin,
                    coins: row.coins
                }));
                resolve(list);
            }
        });
    })
}


//da eseguire dopo cookInternationalDish per sbloccre il relativo item
exports.unlockInternationalItem = (item) => {

    //di base gli oggetti speciali sono sbloccabili a lv 9999 ("irraggiungibile" per l'utente)
    //appena viene sbloccato tramite "TRY NEW" viene impostato unlock_at=0 in modo da renderlo visibile
    return new Promise((resolve, reject) => {

        const query = `UPDATE items SET bought=1, unlock_at=0 WHERE id=? AND international=1;`;

        db.run(query, [item.id], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {

                resolve(this.changes > 0);
            }
        })
    })
}

exports.isItemUnlocked = (item) => {

    return new Promise((resolve, reject) => {
        const query = `SELECT count(*) as match FROM items WHERE id=? AND locked=0`;

        db.get(query, [item.id], (err, row) => {

            if (err) {
                reject(err);
                return;

            } else {
                //ritorno true se item è stato sbloccato, false altrimenti
                const exists = row.match > 0;
                resolve(exists);
            }
        });
    })

}



/*          TIPS            */

exports.getTips = () => {

    return new Promise((resolve, reject) => {
        const query = `SELECT *  FROM tips`;

        db.all(query, (err, rows) => {

            if (err) {
                reject(err);
                return;

            } else {
                const list = rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    locked: row.locked, //0 o 1 
                    preview: row.preview,
                    description: row.description,
                    img: row.img,
                    type: row.type
                }));
                resolve(list);
            }
        });
    })
}

exports.unlockTip = (tip) => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE tips SET locked=0 WHERE id=?`;

        db.run(query, [tip.id], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })
}

//query per prendere una sola tip non ancora sbloccata
exports.getLockedTip = () => {

    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM tips WHERE locked=1 LIMIT 1`;

        db.get(query, [], (err, row) => {

            if (err) {
                reject(err);
                return;

            } else {
                resolve(row);
            }
        });
    })
}




exports.isTipUnlocked = (tip) => {

    return new Promise((resolve, reject) => {
        const query = `SELECT count(*) as match FROM tips WHERE id=? AND locked=0`;

        db.get(query, [tip.id], (err, row) => {

            if (err) {
                reject(err);
                return;

            } else {
                //ritorno true se tip è stato sbloccato, false altrimenti
                const exists = row.match > 0;
                resolve(exists);
            }
        });
    })

}


/*          GOALS           */

exports.getGoals = () => {

    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM goals`;

        db.all(query, (err, rows) => {

            if (err) {
                reject(err);
                return;

            } else {
                const list = rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    unlock_at: row.unlock_at,
                    description: row.description,
                    exp: row.exp,
                    coins: row.coins,
                    selected: row.selected,
                    trials: row.trials,
                    num_success: row.num_success,
                    needed_success: row.needed_success,
                    food_to_eat: row.food_to_eat,
                    original_trials: row.original_trials,
                    finished: row.finished
                }));
                resolve(list);
            }
        });
    })
}

//query per prendere un goal per id
exports.getGoalById = (goal) => {

    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM goals WHERE id=?`;

        db.get(query, [goal], (err, row) => {

            if (err) {
                reject(err);
                return;

            } else {
                resolve(row);
            }
        });
    })
}

exports.selectGoal = (goal) => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE goals SET selected=1 WHERE id=?`;

        db.run(query, [goal.id], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })
}

exports.reduceTrials = () => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE goals SET trials = trials - 1 WHERE selected=1 AND finished=0`;

        db.run(query, [], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })
}

exports.increaseSuccess = (food) => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE goals SET num_success = num_success + 1 WHERE selected=1 AND food_to_eat=? AND num_success<needed_success`;

        db.run(query, [food.name], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })
}

exports.unselectGoal = (goal) => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE goals SET selected=0 WHERE id=?`;

        db.run(query, [goal.id], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })

}

//ogni volta che l'utente mangia, controllo se sono finiti i tentativi di qualche goal 
exports.setGoalsFinished = () => {

    //se trials=0 o num_success>=needed_success, allora finished=1

    return new Promise((resolve, reject) => {
        const query = `UPDATE goals SET finished=1 WHERE selected=1 AND finished=0 AND (trials=0 OR num_success>=needed_success)`;

        db.run(query, [], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })

}


// Da lanciare quando fai check results, per vedere se il goal è stato completato con successo
exports.isGoalSuccessfullyCompleted = (goal) => {

    return new Promise((resolve, reject) => {

        const query = `SELECT count(*) as match, coins as coins, exp as exp FROM goals WHERE id=? AND selected=1 AND finished=1 AND num_success>=needed_success`;

        db.get(query, [goal.id], (err, row) => {

            if (err) {
                reject(err);
                return;

            } else {
                //ritorno true se goal è stato completato con successo, false altrimenti
                const exists = row.match > 0;
                resolve({ exists: exists, coins: row.coins, exp: row.exp });
            }
        });
    })
}


exports.isAnyGoalCompleted = () => {

    return new Promise((resolve, reject) => {

        const query = `SELECT count(*) as match, coins as coins, exp as exp FROM goals WHERE selected=1 AND finished=1 AND num_success>=needed_success`;

        db.get(query, [], (err, row) => {

            if (err) {
                reject(err);
                return;

            } else {
                //ritorno true se qualche goal è stato completato con successo, false altrimenti
                const exists = row.match > 0;
                resolve(exists);
            }
        });
    })
}





// Da lanciare quando fai check results, se il goal è stato completato senza successo
// quindi isGoalSuccessfullyCompleted è false, resetto il goal rendendolo nuovamente selezionabile
exports.resetGoal = (goal) => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE goals SET selected=0, finished=0, trials=original_trials, num_success=0 WHERE id=?`;

        db.run(query, [goal.id], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                const exists = this.changes > 0;
                resolve({ exists: exists });

            }
        })
    })

}


exports.deselectGoal = (goal) => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE goals SET selected=0 WHERE id=?`;

        db.run(query, [goal.id], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })
}






/*   INTERNATIONAL DISHES   */


exports.getInternationalDishes = () => {

    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM international_dishes`;

        db.all(query, (err, rows) => {

            if (err) {
                reject(err);
                return;

            } else {
                const list = rows.map((row) => ({
                    id: row.id,
                    name: row.name,
                    locked: row.locked, //0 o 1
                    description: row.description,
                    preview: row.preview,
                    img: row.img,
                    new: row.new,
                    country: row.country,
                    item_id: row.item_id
                }));
                resolve(list);
            }
        });
    })
}

exports.getInternationalDish = () => {

    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM international_dishes WHERE locked=1 ORDER BY id ASC LIMIT 1;`;

        db.get(query, (err, row) => {

            if (err) {
                reject(err);
                return;

            } else {

                if (row !== undefined) {

                    console.log("Row: " + row.id)
                    resolve(row);
                }
                else
                    resolve("");
            }
        });
    })
}

exports.getInternationalDishById = (dishID) => {

    console.log("Dentro dao.getInternationalDishById")
    console.log("DishID da usare per query: " + dishID)

    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM international_dishes WHERE id=?;`;

        db.get(query, [dishID], (err, row) => {

            if (err) {
                reject(err);
                return;

            } else {

                if (row !== undefined) {

                    console.log("Row non è undefined")
                    console.log("Row id: " + row.id)
                    console.log("Row Name: " + row.name)
                    resolve(row);
                }
                else
                    resolve("");
            }
        });
    })
}


exports.unlockInternationaDish = (dish) => {

    return new Promise((resolve, reject) => {

        const query = `UPDATE international_dishes SET locked=0 WHERE locked=1 AND id=?;`;

        db.run(query, [dish.id], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })
}

//setto new=0 per segnalare che il piatto è stato cucinato
exports.cookInternationalDish = (food) => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE international_dishes SET new=0 WHERE name=? and new=1 and locked=0`;

        db.run(query, [food.name], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })

}

exports.setInternationalDishCompleted = (food) => {

    return new Promise((resolve, reject) => {
        const query = `UPDATE international_dishes SET completed=1 WHERE name=?`;

        db.run(query, [food.name], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                console.log("Changes: " + this.changes > 0)
                resolve(this.changes > 0);
            }
        })
    })

}


//query per prendere un itemid da un piatto internazionale sbloccato con uno specifico nome
exports.getInternationalItemId = (food) => {

    return new Promise((resolve, reject) => {
        const query = `SELECT item_id as item_id FROM international_dishes WHERE name=? AND completed=0 AND locked=0 AND new=0`;

        db.get(query, [food.name], (err, row) => {

            if (err) {
                reject(err);
                return;

            } else {
                resolve(row);
            }
        });
    })
}


/*      Check Food      */

//Check per vedere se il cibo mangiato è buono o cattivo
exports.checkFood = (food) => {

    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM food WHERE name=?`;

        db.get(query, [food.name], (err, row) => {


            if (err) {
                console.log("Errore in checkFood, row vale: " + row)
                reject(err);
                return;

            } else {
                console.log("In checkFood, row vale: " + row)
                if (row !== undefined) {
                    resolve(row);
                } else {
                    resolve(row);
                }
            }
        });
    })
}


exports.buyItem = (item) => {

    return new Promise((resolve, reject) => {
        const query = 'UPDATE items SET bought=1 WHERE id=?';

        db.run(query, [item.id], function (err) {

            if (err) {
                reject(err);
                return;
            }

            else {
                resolve(this.changes);
            }
        })
    })
}


/* Daily Meal */

// Per agevolare la simulazione e per non complicare ulteriormente il codice,
// nella tabella daily meal è presente un solo piatto, quindi non c'è bisogno di specificare una data
// per prendere il piatto del giorno.

exports.getDailyMeal = () => {

    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM daily_meals LIMIT 1`;

        db.get(query, [], (err, row) => {

            if (err) {
                reject(err);
                return;

            } else {
                resolve(row);
            }
        });
    })
}