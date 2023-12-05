import { Canister, nat16, query, text, update, Void , Record, Principal, nat64, bool, Vec,StableBTreeMap, ic, Variant, Result, Err, Ok} from 'azle';

// This is a global variable that is stored on the heap
let message = '';
const Todo = Record({
    id: Principal,
    Heading : text,
    content: text,
    createdAt: nat64,
    Markcompleted: bool,
  
})
const User = Record({
    username: text,
    id : Principal,
    createdAt: nat64,
    Todos: Vec(Principal)
})
const todoPayload = Record({
    Heading: text,
    content: text
})

let userList   = StableBTreeMap(Principal, User,1);
let TodoList= StableBTreeMap(Principal, Todo,0);


const AppError = Variant({
    UserDoesnotexist: Principal,
    Tododoesnotexist: Principal,
    TodoAlreadyCompleted: Principal
})

export default Canister({


    // Query calls complete quickly because they do not go through consensus
    getMessage: query([], text, () => {
        return message;
    }),

    createUser: update([text],User,(username) => {
        const id= generateId()
        const user: typeof User = {
            
            username,
            id,
            createdAt: ic.time(),
            Todos: []
        };
        userList.insert(user.id, user);
        return user;
         
             
    }),
    getUsersById: query([Principal], User, (id)=>{
        return userList.get(id);
    }),
    viewUsers: query([], Vec(User), ()=>{
        return userList.values();
   
    }),
    deleteUsers: update([Principal], Result(User,AppError),(id) => {
        const exuser = userList.get(id)
        if( 'None' in exuser){
            return Err({
                UserDoesnotexist: id
            });

        }
        const user =  exuser.Some;
        userList.remove(user.id);
        return Ok(user);
    }),

    createTodos: update([Principal,todoPayload], Result(Todo,AppError), (id, payload)=>{
        const existingUser = userList.get(id);
        const identification = generateId();
        if( 'None' in existingUser){
            return Err({
                UserDoesnotexist: id
            });
        }
        const todo: typeof Todo = {
            id: identification,
            createdAt: ic.time(),
            Markcompleted: false,
             ...payload
        }
       const  existingUserFin = existingUser.Some;
        TodoList.insert(todo.id,todo);
        const addTodo: typeof User= {
            ...existingUserFin,
            Todos: [...existingUserFin.Todos, todo.id]
        }

        userList.insert(addTodo.id, addTodo)

        return Ok(todo);

    }),
    MarkTodoDone:update([Principal], Result(Todo, AppError), (id)=>{
        const todos = TodoList.get(id)
        if( 'None' in todos){
            return Err({
                Tododoesnotexist: id
            });
        }
        const todoo= todos.Some;
        if( todoo.Markcompleted== true){
            return Err({
                TodoAlreadyCompleted: id
            })
        }
        const todo: typeof Todo = {
            ...todoo,
            Markcompleted: true
        }
        return Ok(todo);
    }),

    // deleteTodos: update([Principal,Principal], Result(Todo, AppError), (id,userId)=>{
    //     const todos = TodoList.get(id);
    //     const userIdd = userList.get(userId);
        
    //     const Todol = todos.Some;
    //     if( 'None' in userId){
    //         return Err({
    //             UserDoesnotexist: id
    //         });
    //     }

    //     if( 'None' in todos){
    //         return Err({
    //             Tododoesnotexist: id
    //         });
    //     }
    //   const  usersT = userIdd.Some;
    //   const updatedUser: typeof User= {
    //     ...usersT,
    //     Todos: usersT.Todos.filter((todosId)=>{
    //        todosId.toText() !== Todol.id.ToText()
    //     }) 
    //   };

    //     TodoList.remove(id);
    //     return Ok(todos);
    // }),
  
   

    // Update calls take a few seconds to complete
    // This is because they persist state changes and go through consensus
    setMessage: update([text], Void, (newMessage) => {
        message = newMessage; // This change will be persisted
    }),
    getID:query([], Principal, ()=>{
        const id =  generateId();
        return id;
    })
    
    


});

function generateId(): Principal {
    const randomBytes = new Array(29)
        .fill(0)
        .map((_) => Math.floor(Math.random() * 256));

    return Principal.fromUint8Array(Uint8Array.from(randomBytes));
}

