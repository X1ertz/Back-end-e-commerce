// server.js
const express = require('express');
const { sequelize, DataTypes } = require('./models/models');
const { Users, Category, Products, DiscountCode, Orders, Orderdetail, UsedDiscounts } = require('./models/models');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const multer = require("multer");
const path = require("path");
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
    origin: 'http://0.0.0.0:5500',
    credentials: true
}));


(async () => {
    await sequelize.query("PRAGMA journal_mode=WAL;");
    console.log("Enabled WAL Mode for better concurrency.");
})();


sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');


        sequelize.sync({ force: false })
            .then(() => {
                console.log('All models were synchronized successfully.');
            })
            .catch(error => console.error('Error synchronizing the models:', error));
    })
    .catch(error => {
        console.error('Unable to connect to the database:', error);
    });

app.get('/', (req, res) => {
  res.send('Hello from backend!');
});


app.post('/users', async (req, res) => {
    console.log('Received data from frontend:', req.body); 

    const { username, email, password, role ,adress} = req.body;

    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {

        const existingUser = await Users.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        console.log('Hashed password:', hashedPassword);

        const newUser = await Users.create({
            username: username,
            email: email,
            password: hashedPassword,
            role: role,
            adress:adress
        });

        return res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                adress:newUser.adress
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});
app.get("/users/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await Users.findByPk(userId, {
            attributes: ["id", "username", "email","role","adress"],
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get("/users", async (req, res) => {
    try {
      const users = await Users.findAll();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
app.delete("/users/:id", async (req, res) => {
    try {
      const user = await Users.findByPk(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
  
      await user.destroy();
      res.json({ message: "User deleted" });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete user" });
    }
  });

app.post('/login', async (req, res) => {
    console.log('Received login request:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
       
        const user = await Users.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email' });
        }

 
        const isPasswordValid = await bcrypt.compare(password, user.password);

        console.log("Compare Result:", isPasswordValid);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }

 
        req.session.userId = user.id;
        req.session.username = user.username;

        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
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

  app.get("/discount", async (req, res) => {
    try {
      const discounts = await DiscountCode.findAll();
  
      const discountsWithUsageDetails = [];
      for (let discount of discounts) {
        const usageCount = await UsedDiscounts.count({
          where: { discountcode: discount.discount_name },
        });
  
  
        const usersUsedDiscount = await UsedDiscounts.findAll({
          where: { discountcode: discount.discount_name },
          include: [
            {
              model: Users, 
              required: false, 
              attributes: ['id', 'username'], 
            }
          ],
        });
  
        discountsWithUsageDetails.push({
          ...discount.toJSON(),
          usageCount,
          usersUsedDiscount,
        });
      }
  
      res.status(200).json(discountsWithUsageDetails);
    } catch (error) {
      res.status(500).json({ message: "ไม่สามารถดึงข้อมูลคูปองได้", error });
    }
  });
  
  
  app.get("/discount/:discountId", async (req, res) => {
    try {
        const { discountId } = req.params;
        const discount = await DiscountCode.findByPk(discountId, {
            attributes: ["id", "discount_name", "percentage"],
        });

        if (!discount) {
            return res.status(404).json({ message: "Discount not found" });
        }

        res.json(discount);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


app.post('/login', async (req, res) => {
    console.log('Received login request:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
       
        const user = await Users.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email ' });
        }

       
        console.log('Stored hashed password:', user.password); 
        console.log('Password entered by user:', password); 

    
        const isPasswordValid = await bcrypt.compare(password, user.password);

      
        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }

     
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRATION });

        return res.status(200).json({
            message: 'Login successful',
            token,
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


app.put('/users/:id', async (req, res) => {
    const userId = req.params.id;
    const { username, email, password, role, adress } = req.body; 

    try {
        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (email && email !== user.email) {
            const existingUser = await Users.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already in use' });
            }
        }

        let updatedFields = {
            username: username || user.username,
            email: email || user.email,
            role: role || user.role,
            adress: adress || user.adress,
        };

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updatedFields.password = await bcrypt.hash(password, salt);
        }

        await user.update(updatedFields);

        return res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                address: user.adress,
            },
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Error updating user', error: error.message });
    }
});


app.get('/categories',async(req,res)=>{
    try {
        const categories = await Category.findAll();
        res.json(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
});

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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  
const upload = multer({ storage });
app.post("/products", upload.single("image"), async (req, res) => {
    try {
        const { productname, categoryID, unitprice, quantity, description, sizes } = req.body;
        const imageurl = req.file ? `/uploads/${req.file.filename}` : null; 

        const newProduct = await Products.create({
            productname,
            categoryID,
            unitprice,
            quantity,
            imageurl,
            description,
            sizes: sizes ? JSON.parse(sizes) : [],
        });

        res.status(201).json(newProduct);
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ message: "Failed to add product" });
    }
});
app.put("/products/:id", upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;
        const { productname, categoryID, unitprice, quantity, description, sizes } = req.body;
        const product = await Products.findByPk(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const imageurl = req.file ? `/uploads/${req.file.filename}` : product.imageUrl;

        await product.update({
            productname,
            categoryID,
            unitprice,
            quantity,
            imageurl,
            description,
            sizes: sizes ? JSON.parse(sizes) : [],
        });

        res.json(product);
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Failed to update product" });
    }
});


app.use("/uploads", express.static(path.join(__dirname, "uploads")));



app.post("/order", upload.single("paymentProof"), async (req, res) => {
    try {
      const userId = req.body.userId;
      const items = JSON.parse(req.body.items);
      const totalAmount = req.body.totalAmount;
      const discountUsed = req.body.discountUsed ? JSON.parse(req.body.discountUsed) : null;
      const shippingAddress = req.body.shippingAddress;
      const paymentProofPath = req.file ? `/uploads/${req.file.filename}` : null;
  
      console.log("📌 Received Order Data:", req.body);
  
      if (!userId || !items || !totalAmount || !paymentProofPath) {
        return res.status(400).json({ message: "Missing required fields", error: "Validation error" });
      }
  
      const user = await Users.findByPk(userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
  
      const order = await Orders.create({
        userid: userId,
        discountcode: discountUsed ? discountUsed.id : 0,
        status: "pending",
        shippingaddress: shippingAddress,
        paymentproof: paymentProofPath,
        total:totalAmount
      });
  
      console.log("✅ Order Created:", order.id);
  
      const orderDetails = items.map((item) => ({
        orderid: order.id,
        productid: item.productId,
        unitprice: item.unitPrice,
        quantity: item.quantity,
        itemSize: item.sizes,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
  
      await Orderdetail.bulkCreate(orderDetails);
      console.log("✅ Order Details Saved!");
  
      if (discountUsed) {
        await UsedDiscounts.create({
          userid: userId,
          discountcode: discountUsed.code,
        });
        console.log("✅ Used Discount Saved!");
      }
  
      res.status(201).json({ message: "Order placed successfully!", orderId: order.id });
    } catch (error) {
      console.error("❌ Error saving order:", error);
      res.status(500).json({ message: "Failed to place order", error: error.message });
    }
  });
  app.post("/admin/order", upload.single("image"), async (req, res) => {
    try {
        console.log("📌 Received Request Body:", req.body);

        const { username, status, shippingAddress, discountCode, selectedSizes } = req.body;
        let products = [];
        let quantities = [];

        if (req.body.selectedProducts && req.body.quantities) {
            try {
                if (typeof req.body.selectedProducts === 'string') {
                    products = JSON.parse(req.body.selectedProducts);
                } else {
                    products = req.body.selectedProducts;
                }

                if (typeof req.body.quantities === 'string') {
                    quantities = JSON.parse(req.body.quantities);
                } else {
                    quantities = req.body.quantities;
                }
            } catch (error) {
                return res.status(400).json({ message: "Invalid JSON format for selectedProducts or quantities" });
            }
        } else {
            return res.status(400).json({ message: "selectedProducts or quantities are missing" });
        }

        const image = req.file ? `/uploads/${req.file.filename}` : null;

        console.log("📌 Parsed Data:", { products, quantities, selectedSizes, username, status, shippingAddress, discountCode, image });

        if (!username || !products.length || !quantities.length || !selectedSizes || !image) {
            return res.status(400).json({ message: "Missing required fields", error: "Validation error" });
        }

        const user = await Users.findOne({ where: { username } });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const order = await Orders.create({
            userid: user.id,
            status,
            shippingaddress: shippingAddress,
            discountcode: discountCode,
            paymentproof: image,
        });

        console.log("✅ Order Created:", order.id);

        const orderDetails = [];
        let totalAmount = 0;

        for (let i = 0; i < products.length; i++) {
            const product = await Products.findByPk(products[i]);
            if (!product) {
                return res.status(400).json({ message: `Product with ID ${products[i]} not found` });
            }

            const unitPrice = product.unitprice;
            const quantity = quantities[i];
            const size = selectedSizes[i]; 
            const totalPrice = unitPrice * quantity;
            totalAmount += totalPrice;

            orderDetails.push({
                orderid: order.id,
                productid: products[i],
                size: size, 
                unitprice: unitPrice,
                quantity,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        await Orders.update({ totalAmount }, { where: { id: order.id } });
        await Orderdetail.bulkCreate(orderDetails);
        console.log("✅ Order Details Saved!");

        if (discountCode) {
            const discount = await DiscountCode.findOne({ where: { id: discountCode } });
            if (discount) {
                await UsedDiscounts.create({
                    userid: user.id,
                    discountcode: discount.discount_name,
                });
                console.log("✅ Used Discount Saved!");
            }
        }

        res.status(201).json({ message: "Order placed successfully!", orderId: order.id, totalAmount });
    } catch (error) {
        console.error("❌ Error saving order:", error);
        res.status(500).json({ message: "Failed to place order", error: error.message });
    }
});


app.post('/discounts/check', async (req, res) => {
    const { code } = req.body;
    console.log("Received code:", code); 
    try {
        const discount = await DiscountCode.findOne({ where: { discount_name: code } });
        
        const Useddiscount = await UsedDiscounts.findOne({ where: { discountcode: code } });

        if (Useddiscount) {
            console.log("⚠️ Discount code in use:", code);
            return res.status(400).json({
                message: "Discount code in use"
            });
        }

        if (!discount) {
            console.log("⚠️ Invalid discount code attempted:", code);
            return res.status(404).json({
                message: "Invalid discount code"
            });
        }


        console.log("✅ Valid discount found:", discount);
        return res.json({
            percentage: discount.percentage,
            id: discount.id,
            code:discount.discount_name,
            message: `✅ Applied ${discount.percentage}% discount`
        });

    } catch (error) {
        console.error("❌ Error checking discount code:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
app.get('/orders',async(req,res)=>{
    try{
        const orders = await Orders.findAll();
        res.json(orders);
    }catch(error){
        console.log("Error to get orders",error);
        return res.status(400).json({message:"Internal Server Error"})
    }
});

app.get('/orders/:id', async (req, res) => {
    const { id } = req.params;

    try {

        const order = await Orders.findOne({
            where: { id },
            include: [{
                model: Orderdetail,
                include: {
                    model: Products,
                }
            }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }


        const orderData = {
            id: order.id,
            status: order.status,
            userid: order.userid,
            paymentproof: order.paymentproof,
            shippingaddress: order.shippingaddress,
            discount:order.discountcode,
            total:order.total,
            orderdetails: order.Orderdetails.map(orderdetail => ({
                unitprice: orderdetail.unitprice,
                quantity: orderdetail.quantity,
                productid: orderdetail.productid,
                product: orderdetail.Product, 
                size: orderdetail.itemSize
            }))
        };


        res.json(orderData);

    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.put("/orders/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, shippingaddress, size } = req.body;
        const order = await Orders.findByPk(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.status = status;
        order.shippingaddress = shippingaddress;
        await order.save();

        res.json(order);
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
app.patch('/products/:productId/update-stock', async (req, res) => {
    const { productId } = req.params;
    const { size, quantity } = req.body; 
    try {
        const product = await Products.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const sizes = JSON.parse(product.sizes);

        const selectedSize = sizes.find(s => s.sizeName === size);
        if (!selectedSize) {
            return res.status(400).json({ message: 'Invalid size selected' });
        }


        if (selectedSize.stock < Math.abs(quantity)) {
            return res.status(400).json({ message: 'Insufficient stock for this size' });
        }

        selectedSize.stock += quantity;  
        const updatedTotalQuantity = sizes.reduce((acc, curr) => acc + curr.stock, 0);
        product.quantity = updatedTotalQuantity;

        product.sizes = JSON.stringify(sizes);
        await product.save();

        res.status(200).json({ message: 'Stock updated successfully', product });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ message: 'Error updating stock', error });
    }
});


app.put('/orders/:orderId/items/:productId', async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const { quantity } = req.body;


        const orderDetail = await Orderdetail.findOne({
            where: { orderid: orderId, productid: productId }
        });

        if (!orderDetail) {
            return res.status(404).json({ message: 'Order item not found' });
        }

        
        orderDetail.quantity = quantity;
        await orderDetail.save();

        
        const updatedOrder = await Orders.findOne({
            where: { id: orderId },
            include: [{ model: Orderdetail }]
        });

        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order item quantity:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
app.post('/orders/:orderId/add-product', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { productid, quantity, size } = req.body;
        console.log(req.body);

        if (!productid || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Invalid product data' });
        }

        const order = await Orders.findByPk(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const product = await Products.findByPk(productid);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const unitprice = product.unitprice;

        let orderDetail = await Orderdetail.findOne({
            where: { orderid: orderId, productid }
        });

        if (orderDetail) {
            orderDetail.quantity += quantity;
            await orderDetail.save();
        } else {
            orderDetail = await Orderdetail.create({
                orderid: orderId,
                productid,
                quantity,
                unitprice,
                itemSize: size
            });
        }

        const updatedOrderDetails = await Orderdetail.findAll({
            where: { orderid: orderId }
        });

        let newTotal = 0;
        updatedOrderDetails.forEach(item => {
            newTotal += item.unitprice * item.quantity;
        });

        if (order.discountcode) {
            const discount = await DiscountCode.findByPk(order.discountcode);
            if (discount) {
                newTotal = newTotal - (newTotal * discount.percentage) / 100;
            }
        }

        await order.update({ total: newTotal });

        const updatedOrder = await Orders.findOne({
            where: { id: orderId },
            include: [{ model: Orderdetail }]
        });

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error adding product to order:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/orders/:orderId/item/:itemId', async (req, res) => {
    const { orderId, itemId } = req.params;
    try {
        const result = await Orderdetail.destroy({ where: { productid: itemId, orderId } });
        if (result) {
            res.json({ message: "Item deleted successfully" });
        } else {
            res.status(404).json({ error: "Item not found" });
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.delete('/orders/:orderId', async (req, res) => {
    const { orderId} = req.params;
    try {
        const result = await Orders.destroy({ where: { id: orderId } });
        if (result) {
            res.json({ message: "Order deleted successfully" });
        } else {
            res.status(404).json({ error: "Order not found" });
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


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

app.post("/discount", async (req, res) => {
    const { discount_name, percentage } = req.body;
    if (!discount_name || !percentage) {
        return res.status(400).json({ message: "Invalid data" });
    }

    try {
        const newDiscount = await DiscountCode.create({ discount_name, percentage });
        res.status(201).json(newDiscount);
    } catch (error) {
        res.status(500).json({ message: "Failed to create discount code", error });
    }
});

app.delete("/discount/:id", async (req, res) => {
    const { id } = req.params;

    try {

        const discount = await DiscountCode.findByPk(id);

        if (!discount) {
            return res.status(404).json({ message: "Discount code not found" });
        }

        await discount.destroy();

        res.status(200).json({ message: "Discount code deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete discount code", error });
    }
});

app.put("/discount/:id", async (req, res) => {
    const { id } = req.params;
    const { discount_name, percentage } = req.body;

    if (!discount_name || !percentage) {
        return res.status(400).json({ message: "Invalid data" });
    }

    try {
        const discount = await DiscountCode.findByPk(id);

        if (!discount) {
            return res.status(404).json({ message: "Discount code not found" });
        }

        discount.discount_name = discount_name;
        discount.percentage = percentage;
        await discount.save();

        res.status(200).json(discount);
    } catch (error) {
        res.status(500).json({ message: "Failed to update discount code", error });
    }
});
app.get("/used-discounts", async (req, res) => {
    try {
      const usedDiscounts = await UsedDiscounts.findAll({
        include: [
          {
            model: Users,
            attributes: ['id', 'username'],
          },
          {
            model: DiscountCode,
            attributes: ['id', 'discount_name'],
          },
        ],
      });
  
      res.status(200).json(usedDiscounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch used discounts", error });
    }
  });
    
app.post("/used-discount", async (req, res) => {
    const { userid, discountcode } = req.body;
  
    if (!userid || !discountcode) {
      return res.status(400).json({ message: "Invalid data" });
    }
  
    try {
      const newUsedDiscount = await UsedDiscounts.create({
        userid,
        discountcode,
      });
  
      res.status(201).json(newUsedDiscount);
    } catch (error) {
      res.status(500).json({ message: "Failed to create used discount", error });
    }
  });

app.delete("/used-discount/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const deletedDiscount = await UsedDiscounts.destroy({
        where: { id }
      });
  
      if (!deletedDiscount) {
        return res.status(404).json({ message: "Used discount not found" });
      }
  
      res.status(200).json({ message: "Used discount deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete used discount", error });
    }
  });

  app.put("/used-discount/:id", async (req, res) => {
    const { id } = req.params;
    const { userid, discountcode } = req.body;
  
    if (!userid || !discountcode) {
      return res.status(400).json({ message: "Invalid data" });
    }
  
    try {

      const usedDiscount = await UsedDiscounts.findByPk(id);
  
      if (!usedDiscount) {
        return res.status(404).json({ message: "Used discount not found" });
      }
  
      usedDiscount.userid = userid;
      usedDiscount.discountcode = discountcode;
      
      await usedDiscount.save();
  
      res.status(200).json({ message: "Used discount updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update used discount", error });
    }
  });
  
app.put("/users/:id/password", async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
  
    try {
      const user = await Users.findByPk(id);
  
      if (!user) {
        return res.status(404).json({ error: "ไม่พบผู้ใช้" });
      }
  

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "รหัสผ่านเดิมไม่ถูกต้อง" });
      }
  
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  
      await Users.update({ password: hashedNewPassword }, { where: { id } });
  
      res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ!" });
    } catch (error) {
      res.status(500).json({ error: "เกิดข้อผิดพลาด" });
    }
  });

app.get('/orders/user/:userId', async (req, res) => {
    const { userId } = req.params; 

    try {
        const orders = await Orders.findAll({
            where: { userid: userId },
            include: [{
                model: Orderdetail,
                include: {
                    model: Products,
                }
            }]
        });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for this user' });
        }

        const orderData = orders.map(order => ({
            id: order.id,
            status: order.status,
            userid: order.userid,
            shippingaddress: order.shippingaddress,
            discount: order.discountcode,
            orderdetails: order.Orderdetails.map(orderdetail => ({
                unitprice: orderdetail.unitprice,
                quantity: orderdetail.quantity,
                productid: orderdetail.productid,
                product: orderdetail.Product, 
                size: orderdetail.itemSize
            }))
        }));

        res.json(orderData);

    } catch (error) {
        console.error('Error fetching orders for user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get("/reports", async (req, res) => {
    try {
        const orders = await Orders.findAll({
            include: [
                {
                    model: Users,
                    attributes: ["username", "email"],
                },
                {
                    model: Orderdetail,
                    include: [
                        {
                            model: Products,
                            attributes: ["productname", "unitprice"],
                            include: [{ model: Category, attributes: ["Categoryname"] }],
                        },
                    ],
                },
            ],
        });
        const discounts = await DiscountCode.findAll({
            attributes: ["id", "discount_name", "percentage"]
        });
        const discountMap = discounts.reduce((acc, discount) => {
            acc[discount.id] = {
                name: discount.discount_name,
                percentage: discount.percentage
            };
            return acc;
        }, {});
        const formattedOrders = orders.flatMap(order =>
            order.Orderdetails.map(detail => ({
                id: order.id,
                total:order.total,
                status: order.status,
                user: order.User,
                product: detail.Product,
                quantity: detail.quantity,
                unitprice: detail.unitprice,
                discount_name: discountMap[order.discountcode]?.name || "No Discount", 
                discount_percentage: discountMap[order.discountcode]?.percentage || 0,
            }))
        );

        res.json(formattedOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


process.on('SIGINT', async () => {
    await sequelize.close();
    console.log('SQLite connection closed.');
    process.exit(0);
});

app.listen(port, () => {
    console.log(`http://0.0.0.0:${port}}`);
  });