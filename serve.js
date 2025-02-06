// server.js
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors());
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
        defaultValue: 'nonmember',
    },
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
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
        allowNull: true
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

// Setting up relationships (Associations)

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
    console.log('Received data from frontend:', req.body); // Log ข้อมูลที่รับจาก frontend
    
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
  
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
  
    try {
      const newUser = await Users.create({
        username: name,
        email,
        password: hashedPassword,
      });
      return res.status(201).json({
        message: 'User created successfully',
        user: newUser,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error creating user', error: error.message });
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
  