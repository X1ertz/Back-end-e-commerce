const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
// เชื่อมต่อ SQLite Database
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "e-commerce.sqlite",
});

// สร้าง Model สำหรับ Categories
const Category = sequelize.define("Category", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Categoryname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// สร้าง Model สำหรับ Products
const Product = sequelize.define("Product", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  productname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoryID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Category,
      key: "id",
    },
  },
  unitprice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  imageurl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sizes: {
    type: DataTypes.JSONB,  
    allowNull: true,
  }
});
const DiscountCode = sequelize.define('DiscountCode',{
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  discount_name: {  // เพิ่มฟิลด์นี้
    type: DataTypes.STRING,
    allowNull: false,  // ไม่ให้เป็น null
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
 
});
async function seedUsers() {
  const hashedPassword = await bcrypt.hash("admin123", 10); // Hash password
  await Users.bulkCreate([
    {
      username: "admin",
      password: hashedPassword,
      email: "admin@example.com",
      role: "admin",
      address: "123 Admin Street, Bangkok",
    },
  ]);
  console.log("✅ Users seeded successfully!");
}

const insertData = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log("📌 Database synced successfully.");
    await DiscountCode.bulkCreate([
      { discount_name: "SALE10-NEWYEAR2025", percentage: 10 ,amount:10},
      { discount_name: "SUMMERSALE20-OFF", percentage: 20 ,amount:10},
      { discount_name: "BLACKFRIDAY-SAVE10", percentage: 10 ,amount:10},
      { discount_name: "EXTRA5-PROMO2025", percentage: 5 ,amount:10},
      { discount_name: "FLASHDEAL15-OFF", percentage: 15 ,amount:10},
      { discount_name: "WINTERSALE20-OFF2025", percentage: 20 ,amount:10},
      { discount_name: "SPRINGPROMO-15-OFF", percentage: 15 ,amount:10}
    ]);
    
    await Category.bulkCreate([
      { Categoryname: "Shirts" },       
      { Categoryname: "Pants" },        
      { Categoryname: "Shoes" },        
      { Categoryname: "Accessories" },  
    ]);
    console.log("✅ Categories inserted successfully.");

    
    await Product.bulkCreate([
      {
        productname: "Casual Shirt",
        categoryID: 1,  
        unitprice: 499,
        quantity: 30,
        imageurl: "/uploads/shirt.png",
        description: "A comfortable casual shirt.",
        sizes: JSON.stringify([
          { sizeName: "S", stock: 10 },
          { sizeName: "M", stock: 15 },
          { sizeName: "L", stock: 5 }
        ]),  
      },
      {
        productname: "Slim Fit Jeans",
        categoryID: 2,  
        unitprice: 799,
        quantity: 25,
        imageurl: "/uploads/denims.png",
        description: "Stylish and slim fit jeans.",
        sizes: JSON.stringify([
          { sizeName: "M", stock: 10 },
          { sizeName: "L", stock: 10 },
          { sizeName: "XL", stock: 5 }
        ]),  
      },
      {
        productname: "Polo Shirt",
        categoryID: 1,  
        unitprice: 599,
        quantity: 20,
        imageurl: "/uploads/redboy.png",
        description: "A stylish polo shirt for casual wear.",
        sizes: JSON.stringify([
          { sizeName: "S", stock: 7 },
          { sizeName: "M", stock: 8 },
          { sizeName: "L", stock: 5 }
        ]),  
      },
      {
        productname: "Men's Suits",
        categoryID: 1,  
        unitprice: 899,
        quantity: 15,
        imageurl: "/uploads/suit.png",
        description: "Comfortable chinos for work or leisure.",
        sizes: JSON.stringify([
          { sizeName: "M", stock: 5 },
          { sizeName: "L", stock: 7 },
          { sizeName: "XL", stock: 3 }
        ]), 
      },
      {
        productname: "White Sneakers",
        categoryID: 3,  
        unitprice: 1299,
        quantity: 40,
        imageurl: "/uploads/sneaker.png",
        description: "Classic white sneakers for everyday wear.",
        sizes: JSON.stringify([
          { sizeName: "S", stock: 10 },
          { sizeName: "M", stock: 15 },
          { sizeName: "L", stock: 15 }
        ]), 
      },
      {
        productname: "T-Shirt",
        categoryID: 1, 
        unitprice: 399,
        quantity: 60,
        imageurl: "/uploads/tshirt.png",
        description: "Basic T-shirt, comfortable and versatile.",
        sizes: JSON.stringify([
          { sizeName: "S", stock: 20 },
          { sizeName: "M", stock: 25 },
          { sizeName: "L", stock: 15 }
        ]),  
      },
      {
        productname: "Running Shorts",
        categoryID: 2,  
        unitprice: 599,
        quantity: 35,
        imageurl: "/uploads/spplant.png",
        description: "Perfect for sports and exercise.",
        sizes: JSON.stringify([
          { sizeName: "S", stock: 10 },
          { sizeName: "M", stock: 15 },
          { sizeName: "L", stock: 10 }
        ]), 
      },
      {
        productname: "Formal Shirt",
        categoryID: 1,  
        unitprice: 899,
        quantity: 20,
        imageurl: "/uploads/formal.png",
        description: "A stylish formal shirt for office wear.",
        sizes: JSON.stringify([
          { sizeName: "S", stock: 5 },
          { sizeName: "M", stock: 10 },
          { sizeName: "L", stock: 5 }
        ])
      },
      {
        productname: "Denim Jacket",
        categoryID: 1,  
        unitprice: 1299,
        quantity: 15,
        imageurl: "/uploads/hood.png",
        description: "A trendy denim jacket for all occasions.",
        sizes: JSON.stringify([
          { sizeName: "S", stock: 3 },
          { sizeName: "M", stock: 7 },
          { sizeName: "L", stock: 5 }
        ])
      },
      {
        productname: "Jeans",
        categoryID: 2,  
        unitprice: 1199,
        quantity: 25,
        imageurl: "/uploads/jean.png",
        description: "Classic blue denim jeans.",
        sizes: JSON.stringify([
          { sizeName: "S", stock: 8 },
          { sizeName: "M", stock: 10 },
          { sizeName: "L", stock: 7 }
        ])
      },
      {
        productname: "Chino Pants",
        categoryID: 2,  
        unitprice: 999,
        quantity: 18,
        imageurl: "/uploads/chino.png",
        description: "Comfortable and stylish chino pants.",
        sizes: JSON.stringify([
          { sizeName: "S", stock: 4 },
          { sizeName: "M", stock: 8 },
          { sizeName: "L", stock: 6 }
        ])
      },
      {
        productname: "Cargo Pants",
        categoryID: 2,  
        unitprice: 1099,
        quantity: 22,
        imageurl: "/uploads/cargo.png",
        description: "Durable cargo pants with multiple pockets.",
        sizes: JSON.stringify([
          { sizeName: "S", stock: 6 },
          { sizeName: "M", stock: 10 },
          { sizeName: "L", stock: 6 }
        ])
      }
    ]);
    const bcrypt = require("bcrypt");

    await seedUsers();

    console.log("✅ Products inserted successfully!");
  } catch (error) {
    console.error("❌ Error inserting data:", error);
  } finally {
    await sequelize.close();
  }
};

insertData();

