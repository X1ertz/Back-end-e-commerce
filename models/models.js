const { Sequelize, DataTypes } = require('sequelize');
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
    discountcode: {
    type: DataTypes.INTEGER,
    allowNull: true,
},
    status: {
        type: DataTypes.STRING,
        defaultValue: 'wait',
    },
    paymentproof:{
        type:DataTypes.STRING,
        allowNull: true,
    },
    shippingaddress:{
        type:DataTypes.STRING,
        allowNull: true
    },
    total:{
        type:DataTypes.INTEGER,
        allowNull:false
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
        allowNull: true
    },
    itemSize:{
        type:DataTypes.STRING,
        allowNull:true
    }
});
// UsedDiscounts Model
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
    discountcode: {
        type: DataTypes.STRING,
        allowNull: true
    }
}
);

Users.hasMany(Orders, { foreignKey: 'userid' });
Orders.belongsTo(Users, { foreignKey: 'userid' });


Category.hasMany(Products, { foreignKey: 'categoryID' });
Products.belongsTo(Category, { foreignKey: 'categoryID' });


Orders.hasMany(Orderdetail, { foreignKey: 'orderid' });
Orderdetail.belongsTo(Orders, { foreignKey: 'orderid' });


Products.hasMany(Orderdetail, { foreignKey: 'productid' });
Orderdetail.belongsTo(Products, { foreignKey: 'productid' });

Orders.belongsTo(DiscountCode, { foreignKey: 'discountcodeid' });
DiscountCode.hasMany(Orders, { foreignKey: 'discountcodeid' });

Users.hasMany(UsedDiscounts, { foreignKey: 'userid' });
DiscountCode.hasMany(UsedDiscounts, { foreignKey: 'discountcodeid' });

UsedDiscounts.belongsTo(Users, { foreignKey: 'userid' });
UsedDiscounts.belongsTo(DiscountCode, { foreignKey: 'discountcodeid' });

module.exports = {
    sequelize,
    Users,
    Category,
    Products,
    DiscountCode,
    Orders,
    Orderdetail,
    UsedDiscounts,
    DataTypes
};