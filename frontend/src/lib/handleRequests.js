const DOMAIN = "http://localhost:4000"

export function getTrackInfo(id) {
    return new Promise((resolve, reject) => {
        fetch(DOMAIN + `/tracks/${id}/info`, {
            credentials: "include"
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve(data.data);
                } else {
                    reject(data.message);
                }
            })
            .catch(error => reject(error));
    })
}
export function getTrackSize(id, quality) {
    return new Promise((resolve, reject) => {
        fetch(`${DOMAIN}/tracks/${id}/size?quality=${quality}`, {
            credentials: "include"
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve(data.data);
                } else {
                    reject(data.message);
                }
            })
            .catch(error => reject(error));
    })
}

export function authIn(username, password) {
    return new Promise((resolve, reject) => {
        fetch(DOMAIN + "/auth/sign-in", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve(data);
                } else {
                    reject(data);
                }
            })
            .catch(error => reject(error));
    })
}

export function authProfile() {
    return new Promise((resolve, reject) => {
        fetch(DOMAIN + "/auth/profile", {
            credentials: "include"
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve(data.data);
                } else {
                    reject(data);
                }
            })
            .catch(error => reject(error));
    })
}