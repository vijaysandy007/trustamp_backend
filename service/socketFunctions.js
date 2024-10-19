const { client, persistentClient } = require("./redis");

(async function() {
    await client.flushdb();
})();

const addUser = (user, type) => {
    return new Promise((resolve, reject) => {
        client
            .multi()
            .lrem(user.userId + "-" + type, 0, user.id)
            .lpush(user.userId + "-" + type, user.id)
            .expire(user.userId + "-" + type, 60 * 60 * 24)
            .exec()
            .then(
                (res) => {
                    resolve({ status: true, message: "User added" });
                },
                (err) => {
                    reject({ status: false, message: err.message });
                }
            );
    });
};

const updateLastSeen = (userId, status) => {
    return new Promise((resolve, reject) => {
        persistentClient
            .multi()
            .hset(userId, "lastseen", new Date().getTime())
            .hset(userId, "online", status)
            .exec()
            .then(
                (res) => {
                    resolve({ status: true, message: "Lastseen updated" });
                },
                (err) => {
                    reject({ status: false, message: err.message });
                }
            );
    });
};

const getLastSeen = (userId) => {
    return new Promise((resolve, reject) => {
        persistentClient.hvals(userId).then(
            (res) => {
                if (res[1] == "1") {
                    resolve({ status: true, data: res });
                }
                resolve({ status: false, data: "" });
            },
            (err) => {
                reject({ status: false, message: err.message });
            }
        );
    });
};

const removeUser = (user, id, type) => {
    return new Promise((resolve, reject) => {
        client.lrem(user + "-" + type, 1, id).then(
            (res) => {
                if (res === 1) {
                    resolve({ status: true, message: "User removed" });
                }
                resolve({ status: true, message: "User not in list" });
            },
            (err) => {
                resolve({ status: false, message: err.message });
            }
        );
    });
};

const isUserActive = (user, type) => {
    return new Promise((resolve, reject) => {
        client
            .multi()
            .llen(user + "-" + type)
            .exec()
            .then(
                (res) => {
                    if (res[0] > 0) {
                        resolve({ status: true, message: "user online" });
                    }
                    reject({ status: false, message: "no user" });
                },
                (err) => {
                    reject({ status: false, message: err.message });
                }
            );
    });
};

const getSocketId = (user, type) => {
    return new Promise((resolve, reject) => {
        client.lrange(user + "-" + type, 0, -1).then(
            (res) => {
                if (res) {
                    resolve({ status: true, message: "user online", id: res });
                }
                reject({ status: false, message: "no user" });
            },
            (err) => {
                reject({ status: false, message: err.message });
            }
        );
    });
};

module.exports = {
    addUser,
    getSocketId,
    removeUser,
    updateLastSeen,
    getLastSeen
};