import { myCache } from "../app.js";
import { TryCatch } from "../middelwares/error.js";
import { Orders } from "../models/orders.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/feature.js";

const getAdminDashboardStats = TryCatch(async(req, res, next) => {

    let stats = {};

    const key = `admin-stats`

    if(myCache.has(key)){
        stats = JSON.parse(myCache.get(key))
    }        
    else{
        const today = new Date();

        const sixMonthAgo = new Date();
        sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today,
        }
        const lastMonth = {
            start: new Date(today.getFullYear(), today.getMonth() -1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0), 
        }

        const currentMonthProductsPromise  = Product.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            }
        })

        const lastMonthProductsPromise  = Product.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            }
        })

        const currentMonthUsersPromise  = User.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            }
        })

        const lastMonthUsersPromise  = User.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            }
        })

        const currentMonthOrdersPromise  = Orders.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            }
        })

        const lastMonthOrdersPromise  = Orders.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            }
        })

        const lastSixMonthOrdersPromise  = Orders.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today,
            }
        })

        const latestTransactionsPromise = Orders.find({})
        .select('orderItems discount total status')
        .limit(4);
    

        const [ 
            currentMonthProducts,
            lastMonthProducts,
            currentMonthUsers,
            lastMonthUsers,
            currentMonthOrders,
            lastMonthOrders,
            productsCounts,
            usersCounts,
            allOrders,
            lastSixMonthOrders,
            categories,
            femaleUsersCount,
            latestTransactions,
         ] = await Promise.all([
            currentMonthProductsPromise,
            lastMonthProductsPromise,
            currentMonthUsersPromise,
            lastMonthUsersPromise,
            currentMonthOrdersPromise,
            lastMonthOrdersPromise,
            Product.countDocuments(),
            User.countDocuments(),
            Orders.find({}).select("total"),
            lastSixMonthOrdersPromise,
            Product.distinct("category"),
            User.find({gender : "female"}),
            latestTransactionsPromise,
        ])
      
        const usersChangePercentage = calculatePercentage(
            currentMonthUsers.length,
            lastMonthUsers.length
        )
      
        const productsChangePercentage = calculatePercentage(
            currentMonthProducts.length,
            lastMonthProducts.length
        )
      
        const OrdersChangePercentage = calculatePercentage(
            currentMonthOrders.length,
            lastMonthOrders.length
        )

        const currMonthRevenue = currentMonthOrders.reduce(
            (total, order) => total + (order.total || 0),
            0
          );
      
          const lastMonthRevenue = lastMonthOrders.reduce(
            (total, order) => total + (order.total || 0),
            0
          );

          const Revenu = calculatePercentage(currMonthRevenue, lastMonthRevenue)

          const revenu = allOrders.reduce(
            (total, order) => total + (order.total || 0),
            0
          );

          const count = {
            revenu,
            users: usersCounts,
            products: productsCounts,
            orders: allOrders.length
          }

          const orderMonthCounts = new Array(6).fill(0);
          const orderMonthRevenu = new Array(6).fill(0);

          lastSixMonthOrders.forEach((order)=>{
            const creationDate = order.createdAt;
            const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
            
            if(monthDiff < 6){
                orderMonthCounts[6 - 1 - monthDiff] += 1;
                orderMonthRevenu[6 - 1 - monthDiff] += order.total;
            }
            
          })

          const categoryCount = await getInventories(categories, productsCounts);

          const changePercent = {
            Revenu,
            usersChangePercentage,
            productsChangePercentage,
            OrdersChangePercentage,
          }

          const userRatio = {
            male: usersCounts - femaleUsersCount.length,
            female: femaleUsersCount.length
          }

          console.log(latestTransactions)

          const modifiedLatestTransaction = latestTransactions.map((i) => ( {
            _id: i._id,
            discount: i.discount,
            amount: i.total,
            quantity: i.orderItems,
            status: i.status,
          }));

        
        stats = {
            latestTransactions: modifiedLatestTransaction,
            userRatio,
            categoryCount,
            changePercent,
            count,
            chart: {
                order: orderMonthCounts,
                revenu: orderMonthRevenu,
            },
        }   

        myCache.set(key, JSON.stringify(stats));
    }

    return res.status(200).json({
        success: true,
        stats,
       })
})


const getPieChart = TryCatch(async(req, res, next) => {

     let charts = {};

    const key = `admin-pie-charts`

    if(myCache.has(key)){
        charts = JSON.parse(myCache.get(key))
    }        
    else{

        const allOrderPromise = Orders.find({}).select([
          "total",
          "discount",
          "subtotal",
          "tax",
          "shippingCharges",
        ]);


        const [
            processingOrder,
            shippedOrder,
            deliveredOrder,
            categories,
            productsCounts,
            productsOutstock,
            allOrders,
            adminUsers,
            customerUsers,
            allUsers,

        ] = await Promise.all([
            Orders.countDocuments({ status: "Processing" }),
            Orders.countDocuments({ status: "Shipped" }),
            Orders.countDocuments({ status: "Delivered" }),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({stock : 0}),
            allOrderPromise,
            User.countDocuments({role : "admin"}),
            User.countDocuments({role : "user"}),
            User.find({}).select("dob"),

        ])

        const orderFullFillMent = {
            processing: processingOrder,
           shipped: shippedOrder,
           delivered: deliveredOrder,
        }

        const ProductCategories = await getInventories(categories, productsCounts);

        const stocksAvailbility = {
            inStock : productsCounts - productsOutstock,
            outStock : productsOutstock,
        }

        const grossIncome = allOrders.reduce((prev, order) => prev + (order.total || 0) , 0)
        const discounts = allOrders.reduce((prev, order) => prev + (order.discount || 0) , 0)
        const productionCost = allOrders.reduce((prev, order) => prev + (order.shippingCharges || 0) , 0)
        const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0) , 0)
        const marketingCost = Math.round(grossIncome * (30 / 100));

        const netMargin = grossIncome - discounts - productionCost - burnt - marketingCost;

        const revenueDistribution = {
          netMargin,
          discounts,
          productionCost,
          burnt,
          marketingCost,
        };

        const adminCustomer = {
         admin: adminUsers,
         customer: customerUsers,
        };


         const usersAgeGroup = {
             teen: allUsers.filter((i) => i.age < 20).length,
             adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
             old: allUsers.filter((i) => i.age >= 40).length,
            }; 

 
       
    charts = {
        orderFullFillMent,
        ProductCategories,
        stocksAvailbility,
        revenueDistribution,
        adminCustomer,
        usersAgeGroup,
    }

       myCache.set(key, JSON.stringify(charts));

    }
     return res.status(200).json({
        success: true,
        charts,
       })
})

const getBarChart = TryCatch(async(req, res, next) => {

     let charts;

     const key = "admin-bar-charts";

     if(myCache.has(key)){
        charts = JSON.parse(myCache.get(key))
    }        
    else{
        const today = new Date();

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const sixMonthProductPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const sixMonthUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const twelveMonthOrdersPromise = Orders.find({
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const [products, users, orders] = await Promise.all([
      sixMonthProductPromise,
      sixMonthUsersPromise,
      twelveMonthOrdersPromise,
    ]);


      const productCounts = getChartData({ length: 6, today, docArr: products });
      const usersCounts = getChartData({ length: 6, today, docArr: users });
      const ordersCounts = getChartData({ length: 12, today, docArr: orders });

      charts = {
      users: usersCounts,
      products: productCounts,
      orders: ordersCounts,
    };
        
        myCache.set(key, JSON.stringify(charts));
    }

     return res.status(200).json({
        success: true,
        charts,
       })
})

const getLineChart = TryCatch(async(req, res, next) => {
      let charts;
      const key = "admin-line-charts";

      if (charts) charts = JSON.parse(charts);
  else {
    const today = new Date();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    };

    const [products, users, orders] = await Promise.all([
      Product.find(baseQuery).select("createdAt"),
      User.find(baseQuery).select("createdAt"),
      Orders.find(baseQuery).select("createdAt discount total"),
    ]);

    const productCounts = getChartData({ length: 12, today, docArr: products });
    const usersCounts = getChartData({ length: 12, today, docArr: users });
    const discount = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "discount",
    });
    const revenue = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "total",
    });

    charts = {
      users: usersCounts,
      products: productCounts,
      discount,
      revenue,
    };
   
        myCache.set(key, JSON.stringify(charts));
    }

     return res.status(200).json({
        success: true,
        charts,
       })
})

export {getAdminDashboardStats, getPieChart, getBarChart, getLineChart};

