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

//Post
app.post('/users', async (req, res) => {
    console.log('Received data from frontend:', req.body); // Log ข้อมูลที่รับจาก frontend

    const { username, email, password } = req.body;

    // ตรวจสอบว่า fields ทั้งหมดมีข้อมูลหรือไม่
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // ตรวจสอบว่าอีเมลที่ผู้ใช้ใส่มามีในฐานข้อมูลแล้วหรือยัง
        const existingUser = await Users.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // สร้าง salt และแฮชรหัสผ่าน
        const salt = await bcrypt.genSalt(10);  // ตั้งค่าที่ 10 เป็นค่าแนะนำ
        const hashedPassword = await bcrypt.hash(password, salt);
        
        console.log('Hashed password:', hashedPassword); // Log ค่า hashed password

        // สร้างผู้ใช้ใหม่ในฐานข้อมูล
        const newUser = await Users.create({
            username: username,
            email: email,
            password: hashedPassword,
        });

        return res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.error(error);
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


// Login Route
app.post('/login', async (req, res) => {
    console.log('Received login request:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // ค้นหาผู้ใช้จากฐานข้อมูลโดยใช้อีเมล
        const user = await Users.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email ' });
        }

        // Log รหัสผ่านที่แฮชในฐานข้อมูล และรหัสผ่านที่ผู้ใช้กรอก
        console.log('Stored hashed password:', user.password);  // รหัสผ่านที่แฮชจากฐานข้อมูล
        console.log('Password entered by user:', password);  // รหัสผ่านที่กรอกมาจากผู้ใช้

        // ตรวจสอบรหัสผ่านที่ผู้ใช้กรอกมากับรหัสผ่านที่แฮชในฐานข้อมูล
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // Log ผลการเปรียบเทียบ
        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // สร้าง JWT token (สามารถเก็บข้อมูลที่จำเป็นใน token ได้ เช่น user.id)
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRATION });

        return res.status(200).json({
            message: 'Login successful',
            token, // ส่งกลับ JWT token ให้ผู้ใช้
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

// Update User Route
app.put('/update-user', async (req, res) => {
    console.log('Received update request:', req.body);

    const { userId, username, email, password } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // ค้นหาผู้ใช้จากฐานข้อมูลโดยใช้ userId
        const user = await Users.findOne({ where: { id: userId } });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // ถ้ามีการเปลี่ยนแปลงอีเมล ตรวจสอบว่ามีอีเมลนี้ในฐานข้อมูลหรือยัง
        if (email && email !== user.email) {
            const existingUser = await Users.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already in use' });
            }
        }

        // ถ้ามีการเปลี่ยนแปลงรหัสผ่าน
        let hashedPassword = user.password; // รหัสผ่านเดิม
        if (password) {
            // สร้าง salt และแฮชรหัสผ่านใหม่
            const salt = await bcrypt.genSalt(10);  // ตั้งค่าที่ 10 เป็นค่าแนะนำ
            hashedPassword = await bcrypt.hash(password, salt);
        }

        // ทำการอัปเดตข้อมูลผู้ใช้
        user.username = username || user.username;
        user.email = email || user.email;
        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating user', error: error.message });
    }
});

// Delete User Route
app.delete('/delete-user', async (req, res) => {
    console.log('Received delete request:', req.body);

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // ค้นหาผู้ใช้จากฐานข้อมูลโดยใช้ userId
        const user = await Users.findOne({ where: { id: userId } });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // ลบผู้ใช้จากฐานข้อมูล
        await user.destroy();

        return res.status(200).json({
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

// Add Category
app.post('/categories', async (req, res) => {
    const { Categoryname } = req.body;

    if (!Categoryname) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        const category = await Category.create({ Categoryname });
        return res.status(201).json(category);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error creating category', error: error.message });
    }
});

// Update Category
app.put('/categories/:id', async (req, res) => {
    const categoryId = req.params.id;
    const { Categoryname } = req.body;

    if (!Categoryname) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        const [updated] = await Category.update({ Categoryname }, { where: { id: categoryId } });

        if (updated) {
            const updatedCategory = await Category.findByPk(categoryId);
            return res.status(200).json(updatedCategory);
        } else {
            return res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating category', error: error.message });
    }
});

// Delete Category
app.delete('/categories/:id', async (req, res) => {
    const categoryId = req.params.id;

    try {
        const deleted = await Category.destroy({ where: { id: categoryId } });
        if (deleted) {
            return res.status(200).json({ message: 'Category deleted' });
        } else {
            return res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
});

// Add Product
app.post('/products', async (req, res) => {
    const { productname, categoryID, unitprice, quantity } = req.body;

    if (!productname || !categoryID || !unitprice || !quantity) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const product = await Products.create({ productname, categoryID, unitprice, quantity });
        return res.status(201).json(product);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error creating product', error: error.message });
    }
});

// Update Product
app.put('/products/:id', async (req, res) => {
    const productId = req.params.id;
    const { productname, categoryID, unitprice, quantity } = req.body;

    try {
        const [updated] = await Products.update({ productname, categoryID, unitprice, quantity }, { where: { id: productId } });

        if (updated) {
            const updatedProduct = await Products.findByPk(productId);
            return res.status(200).json(updatedProduct);
        } else {
            return res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating product', error: error.message });
    }
});

// Delete Product
app.delete('/products/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        const deleted = await Products.destroy({ where: { id: productId } });
        if (deleted) {
            return res.status(200).json({ message: 'Product deleted' });
        } else {
            return res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
});

// Add Order
app.post('/orders', async (req, res) => {
    const { userid, status } = req.body;

    if (!userid) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const order = await Orders.create({ userid, status });
        return res.status(201).json(order);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error creating order', error: error.message });
    }
});

// Update Order
app.put('/orders/:id', async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    try {
        const [updated] = await Orders.update({ status }, { where: { id: orderId } });

        if (updated) {
            const updatedOrder = await Orders.findByPk(orderId);
            return res.status(200).json(updatedOrder);
        } else {
            return res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating order', error: error.message });
    }
});

// Delete Order
app.delete('/orders/:id', async (req, res) => {
    const orderId = req.params.id;

    try {
        const deleted = await Orders.destroy({ where: { id: orderId } });
        if (deleted) {
            return res.status(200).json({ message: 'Order deleted' });
        } else {
            return res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error deleting order', error: error.message });
    }
});

// Add Order Detail
app.post('/orderdetails', async (req, res) => {
    const { orderid, unitprice, quantity, productid, discount } = req.body;

    if (!orderid || !unitprice || !quantity || !productid || !discount) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const orderDetail = await Orderdetail.create({ orderid, unitprice, quantity, productid, discount });
        return res.status(201).json(orderDetail);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error creating order detail', error: error.message });
    }
});

// Update Order Detail
app.put('/orderdetails/:id', async (req, res) => {
    const orderDetailId = req.params.id;
    const { orderid, unitprice, quantity, productid, discount } = req.body;

    try {
        const [updated] = await Orderdetail.update({ orderid, unitprice, quantity, productid, discount }, { where: { id: orderDetailId } });

        if (updated) {
            const updatedOrderDetail = await Orderdetail.findByPk(orderDetailId);
            return res.status(200).json(updatedOrderDetail);
        } else {
            return res.status(404).json({ message: 'Order detail not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating order detail', error: error.message });
    }
});

// Delete Order Detail
app.delete('/orderdetails/:id', async (req, res) => {
    const orderDetailId = req.params.id;

    try {
        const deleted = await Orderdetail.destroy({ where: { id: orderDetailId } });
        if (deleted) {
            return res.status(200).json({ message: 'Order detail deleted' });
        } else {
            return res.status(404).json({ message: 'Order detail not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error deleting order detail', error: error.message });
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