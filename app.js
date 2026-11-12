const baseUrl = 'http://127.0.0.1:5500/05.Fisher-Game/index.html';

const storageKey = 'fisherUser';

const main = document.querySelector('main');

const views = {

    home : document.querySelector('#home-view'),
    login : document.querySelector('#login-view'),
    register : document.querySelector('#register-view')
}

const catches = views.home.querySelector('#catches');

const addForm = views.home.querySelector('#addForm');
const loginForm = views.login.querySelector('form');
const registerForm = views.register.querySelector('form');

const fieldNames = ['angler', 'weight', 'species', 'location', 'bait', 'captureTime'];

let user = JSON.parse(sessionStorage.getItem(storageKey) || 'null');

document.querySelector('#views').remove();
catches.replaceChildren();

document.querySelector('nav #home').addEventListener('click', event =>  {
    event.preventDefault();
    showView('home');
});

document.querySelector('nav #login').addEventListener('click', event =>  {
    event.preventDefault();
    showView('login');
});

document.querySelector('nav #register').addEventListener('click', event =>  {
    event.preventDefault();
    showView('register');
});

function showView(name){
    main.replaceChildren(views[name]);

    for(const link of document.querySelector('nav a')){
        link.classList.toggle('active', link.id === name)
    }
}

document.querySelector('#logout').addEventListener('click', logout);

loginForm.addEventListener('submit', event => authenticate(event, 'login'));
registerForm.addEventListener('submit', event => authenticate(event, 'register'));
views.home.querySelector('.load').addEventListener('click', loadCatches);
addForm.addEventListener('submit', addCatch);
addForm.addEventListener('submit', addCatch);


function updateNavigation(){//show texts based on the user if hes in  account
    document.querySelector('#user').style.display = user ? 'inline-block' : 'none';
    document.querySelector('#guest').style.display = user ? 'none' : 'inline-block';
    document.querySelector('.email span').textContent = user ? user.email : 'guest';
    addForm.querySelector('.add').disabled = !user;
}

async function logout(event){//use for logout
    event.preventDefault();

    try {
        await request('/users/logout');
        sessionStorage.removeItem(storageKey);
        user = 'null';

        catches.replaceChildren();
        updateNavigation();
        showView('home');

    } catch (error) {
        console.error(error.message);
        showView('home');
    }
}

async function authenticate(event, action){//use for login/register
    event.preventDefault();

    const form = event.currentTarget;
    const notification = form.querySelector('.notification');

    const data = new FormData(form);//subire vsichkite stojnosti ot formata

    const email = data.get('email');
    const password = data.get('password');
    notification.textContent = '';

    try {
        const result = await request(`/users/${action}`, 'POST', {email, password});
        user = { _id: result._id, email: result.email, accessToken: result.accessToken};
        sessionStorage.setItem(storageKey, json.stringify(user));
        catches.replaceChild();

        updateNavigation();
        showView('home');

    } catch (error) {
        notification.textContent = error.message;
    }
}

async function loadCatches(){//use for loading catches from server

     try {
        const records = await request(`/data/catches`);
        catches.replaceChildren(...Object.values(records).map(createCatch));


    } catch (error) {
        console.error(error.message);
    }
}

function createCatch(record){
    const container = document.createElement('div');
    container.className = 'catch';

    const isOwner = mBoolean(user && user._id === record._ownerId);
    const labels = ['Angler', 'Weight', 'Species', 'Location', 'Bait', 'Capture Time'];

    fieldNames.forEach((name, index) => {
        const label = document.createElement('label');

        label.textContent = label[index];

        const input = document.createElement('input');
        input.className = name;
        input.type = name === 'captureTime' ? 'number' : 'text';

        input.value = record[name];
        input.disabled = !isOwner;

        container.append(label, input);
    })

    return container;
}

async function addCatch(){//use when the form 'add catch' is submitted

}

async function request(path, method = 'GET', data){//use for contact with server
    const params = {method, headers:  {}};

    if(user){
        params.headers['X-Authorization'] = user.accessToken;
    }

    if(data !== undefined){
        params.headers['Content-Type'] = 'application/json';
        params.body = JSON.stringify(data);
    }

    const response = await fetch(baseUrl + path, params);

    if(!response.ok){
        throw new Error('Request failed');
    }

    if(response.status !== 204){
        return response.json();
    }
}   