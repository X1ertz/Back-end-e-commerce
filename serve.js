// server.js
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const session = require('express-session');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(session({
    secret: 'your_secret_key', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
// Middlewares
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5500',
    credentials: true
}));
const sequelize = new Sequelize({
    host: 'localhost',
    dialect: 'sqlite',
    storage: 'e-commerce.sqlite',
    retry: {
        max: 5,
        match: [/SQLITE_BUSY/],
        backoffBase: 1000,
        backoffExponent: 1.5
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

(async () => {
    await sequelize.query("PRAGMA journal_mode=WAL;");
    console.log("Enabled WAL Mode for better concurrency.");
})();


//database create here
const Users = sequelize.define('Users', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'member',
    },
    adress:{
        type: DataTypes.STRING,
        allowNull: true,
    }
   
}, {

        
});

// Category Model
const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    Categoryname: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

// Products Model
const Products = sequelize.define('Products', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    productname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categoryID: {
        type: DataTypes.INTEGER,
        references: {
            model: Category,
            key: 'id'
        },
        allowNull: true
    },
    unitprice: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    imageurl:{
        type: DataTypes.STRING,
        allowNull: true
    },
    description:{
        type: DataTypes.STRING,
        allowNull: true
    },
    sizes: {
        type: DataTypes.JSONB,
        allowNull: true,
      }
});
const DiscountCode = sequelize.define('DiscountCode', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    discount_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    percentage: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});


// Orders Model
const Orders = sequelize.define('Orders', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    userid: {
        type: DataTypes.INTEGER,
        references: {
            model: Users,
            key: 'id'
        },
        allowNull: false
    },
    discountcodeid: {
        type: DataTypes.INTEGER,
        references: {
            model: DiscountCode,
            key: 'id'
        },
        allowNull: true // อนุญาตให้ไม่มีส่วนลดได้
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'wait',
    }
});

// OrderDetails Model
const Orderdetail = sequelize.define('Orderdetail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    orderid: {
        type: DataTypes.INTEGER,
        references: {
            model: Orders,
            key: 'id'
        },
        allowNull: true
    },
    unitprice: {
        type: DataTypes.INTEGER,
        allowNull: false  
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false  
    },
    productid: {
        type: DataTypes.INTEGER,
        references: {
            model: Products,
            key: 'id'
        },
        allowNull: true
    },
    discount: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

const UsedDiscounts = sequelize.define('UsedDiscounts', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    userid: {
        type: DataTypes.INTEGER,
        references: {
            model: Users,
            key: 'id'
        },
        allowNull: false
    },
    discountcodeid: {
        type: DataTypes.INTEGER,
        references: {
            model: DiscountCode,
            key: 'id'
        },
        allowNull: false
    }
}, {
    uniqueKeys: {
        unique_user_discount: {
            fields: ['userid', 'discountcodeid']
        }
    }
});

// User-Order relationship: A user can have many orders
Users.hasMany(Orders, { foreignKey: 'userid' });
Orders.belongsTo(Users, { foreignKey: 'userid' });

// Category-Product relationship: A category can have many products
Category.hasMany(Products, { foreignKey: 'categoryID' });
Products.belongsTo(Category, { foreignKey: 'categoryID' });

// Order-Orderdetail relationship: An order can have many order details
Orders.hasMany(Orderdetail, { foreignKey: 'orderid' });
Orderdetail.belongsTo(Orders, { foreignKey: 'orderid' });

// Product-Orderdetail relationship: A product can appear in many order details
Products.hasMany(Orderdetail, { foreignKey: 'productid' });
Orderdetail.belongsTo(Products, { foreignKey: 'productid' });

Orders.belongsTo(DiscountCode, { foreignKey: 'discountcodeid' });
DiscountCode.hasMany(Orders, { foreignKey: 'discountcodeid' });

Users.hasMany(UsedDiscounts, { foreignKey: 'userid' });
DiscountCode.hasMany(UsedDiscounts, { foreignKey: 'discountcodeid' });

UsedDiscounts.belongsTo(Users, { foreignKey: 'userid' });
UsedDiscounts.belongsTo(DiscountCode, { foreignKey: 'discountcodeid' });
sequelize.authenticate()
    .then(() => console.log('Connection has been established successfully.'))
    .catch(error => console.error('Unable to connect to the database:', error));
    sequelize.sync()
    .then(() => console.log('All models were synchronized successfully.'))
    .catch(error => console.error('Error synchronizing the models:', error));
    

app.get('/', (req, res) => {
  res.send('Hello from backend!');
});

app.post('/users', async (req, res) => {
    console.log('Received data from frontend:', req.body);
    
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("Original Password:", password);
        console.log("Hashed Password:", hashedPassword);

        const newUser = await Users.create({
            username,
            email,
            password: hashedPassword, 
        });

        return res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            },
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});
app.get('/user', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await Users.findOne({ where: { id: req.session.userId } });
        console.log("Session Data:", req.session);
        console.log(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ id: user.id, username: user.username });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/login', async (req, res) => {
    console.log('Received login request:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // ค้นหาผู้ใช้จาก email ในฐานข้อมูล
        const user = await Users.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        // ตรวจสอบรหัสผ่านที่เข้ารหัสแล้ว
        const isPasswordValid = await bcrypt.compare(password, user.password);

        console.log("Compare Result:", isPasswordValid);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // ตั้งค่า session เมื่อผู้ใช้ล็อกอินสำเร็จ
        req.session.userId = user.id;
        req.session.username = user.username;

        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

app.get("/products", async (req, res) => {
    try {
      const products = await Products.findAll();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get('/discount', async (req, res) => {
    try {   
      const code = await DiscountCode.findAll();
      res.json(code);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      res.status(500).json({ error: 'Failed to fetch discount codes' });
    }
  });


    
process.on('SIGINT', async () => {
    await sequelize.close();
    console.log('SQLite connection closed.');
    process.exit(0);
});

app.listen(port, () => {
    console.log(`http://localhost:${port}}`);
  });