using Microsoft.EntityFrameworkCore;
using BillFlow.API.Models;

namespace BillFlow.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Invoice>().HasOne(i => i.Customer).WithMany(c => c.Invoices)
            .HasForeignKey(i => i.CustomerId).OnDelete(DeleteBehavior.SetNull);
        mb.Entity<InvoiceItem>().HasOne(ii => ii.Invoice).WithMany(i => i.Items)
            .HasForeignKey(ii => ii.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        mb.Entity<InvoiceItem>().HasOne(ii => ii.Product).WithMany(p => p.InvoiceItems)
            .HasForeignKey(ii => ii.ProductId).OnDelete(DeleteBehavior.SetNull);

        mb.Entity<Product>().Property(p => p.Price).HasColumnType("decimal(18,2)");
        mb.Entity<Product>().Property(p => p.CostPrice).HasColumnType("decimal(18,2)");
        mb.Entity<Invoice>().Property(i => i.Subtotal).HasColumnType("decimal(18,2)");
        mb.Entity<Invoice>().Property(i => i.GSTAmount).HasColumnType("decimal(18,2)");
        mb.Entity<Invoice>().Property(i => i.DiscountAmount).HasColumnType("decimal(18,2)");
        mb.Entity<Invoice>().Property(i => i.Total).HasColumnType("decimal(18,2)");
        mb.Entity<InvoiceItem>().Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
        mb.Entity<InvoiceItem>().Property(i => i.Total).HasColumnType("decimal(18,2)");
    }
}

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        db.Database.EnsureCreated();

        if (!db.Users.Any())
        {
            db.Users.AddRange(
                new User { Username = "admin", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"), Role = "Admin", FullName = "Restaurant Admin" },
                new User { Username = "cashier", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Cashier@123"), Role = "Cashier", FullName = "Front Cashier" }
            );
        }

        if (!db.Products.Any())
        {
            db.Products.AddRange(
                // Starters
                new Product { Name = "Veg Spring Rolls (6 pcs)", SKU = "STR-001", Category = "Starters", Unit = "Plate", Price = 180, CostPrice = 80, Stock = 100, LowStockAlert = 10 },
                new Product { Name = "Chicken Tikka", SKU = "STR-002", Category = "Starters", Unit = "Plate", Price = 320, CostPrice = 150, Stock = 80, LowStockAlert = 10 },
                new Product { Name = "Paneer Tikka", SKU = "STR-003", Category = "Starters", Unit = "Plate", Price = 280, CostPrice = 120, Stock = 80, LowStockAlert = 10 },
                new Product { Name = "Mushroom 65", SKU = "STR-004", Category = "Starters", Unit = "Plate", Price = 220, CostPrice = 90, Stock = 60, LowStockAlert = 10 },
                new Product { Name = "Fish Fingers", SKU = "STR-005", Category = "Starters", Unit = "Plate", Price = 350, CostPrice = 180, Stock = 50, LowStockAlert = 8 },

                // Main Course
                new Product { Name = "Butter Chicken", SKU = "MN-001", Category = "Main Course", Unit = "Plate", Price = 380, CostPrice = 160, Stock = 100, LowStockAlert = 10 },
                new Product { Name = "Dal Makhani", SKU = "MN-002", Category = "Main Course", Unit = "Plate", Price = 260, CostPrice = 100, Stock = 100, LowStockAlert = 10 },
                new Product { Name = "Palak Paneer", SKU = "MN-003", Category = "Main Course", Unit = "Plate", Price = 290, CostPrice = 110, Stock = 80, LowStockAlert = 10 },
                new Product { Name = "Mutton Rogan Josh", SKU = "MN-004", Category = "Main Course", Unit = "Plate", Price = 450, CostPrice = 200, Stock = 60, LowStockAlert = 8 },
                new Product { Name = "Kadai Vegetables", SKU = "MN-005", Category = "Main Course", Unit = "Plate", Price = 240, CostPrice = 90, Stock = 80, LowStockAlert = 10 },
                new Product { Name = "Chicken Curry", SKU = "MN-006", Category = "Main Course", Unit = "Plate", Price = 360, CostPrice = 150, Stock = 80, LowStockAlert = 10 },
                new Product { Name = "Shahi Paneer", SKU = "MN-007", Category = "Main Course", Unit = "Plate", Price = 300, CostPrice = 120, Stock = 70, LowStockAlert = 10 },

                // Rice & Biryani
                new Product { Name = "Veg Biryani", SKU = "RIC-001", Category = "Rice & Biryani", Unit = "Plate", Price = 280, CostPrice = 110, Stock = 100, LowStockAlert = 10 },
                new Product { Name = "Chicken Biryani", SKU = "RIC-002", Category = "Rice & Biryani", Unit = "Plate", Price = 360, CostPrice = 150, Stock = 100, LowStockAlert = 10 },
                new Product { Name = "Mutton Biryani", SKU = "RIC-003", Category = "Rice & Biryani", Unit = "Plate", Price = 420, CostPrice = 190, Stock = 80, LowStockAlert = 8 },
                new Product { Name = "Egg Fried Rice", SKU = "RIC-004", Category = "Rice & Biryani", Unit = "Plate", Price = 220, CostPrice = 80, Stock = 100, LowStockAlert = 10 },
                new Product { Name = "Steamed Rice", SKU = "RIC-005", Category = "Rice & Biryani", Unit = "Bowl", Price = 80, CostPrice = 25, Stock = 200, LowStockAlert = 20 },

                // Breads
                new Product { Name = "Butter Naan", SKU = "BRD-001", Category = "Breads", Unit = "Piece", Price = 45, CostPrice = 15, Stock = 200, LowStockAlert = 20 },
                new Product { Name = "Tandoori Roti", SKU = "BRD-002", Category = "Breads", Unit = "Piece", Price = 35, CostPrice = 12, Stock = 200, LowStockAlert = 20 },
                new Product { Name = "Garlic Naan", SKU = "BRD-003", Category = "Breads", Unit = "Piece", Price = 55, CostPrice = 18, Stock = 150, LowStockAlert = 15 },
                new Product { Name = "Paratha", SKU = "BRD-004", Category = "Breads", Unit = "Piece", Price = 60, CostPrice = 22, Stock = 100, LowStockAlert = 10 },

                // Desserts
                new Product { Name = "Gulab Jamun (2 pcs)", SKU = "DST-001", Category = "Desserts", Unit = "Plate", Price = 90, CostPrice = 35, Stock = 100, LowStockAlert = 10 },
                new Product { Name = "Rasmalai", SKU = "DST-002", Category = "Desserts", Unit = "Plate", Price = 120, CostPrice = 50, Stock = 80, LowStockAlert = 10 },
                new Product { Name = "Ice Cream Scoop", SKU = "DST-003", Category = "Desserts", Unit = "Scoop", Price = 80, CostPrice = 30, Stock = 100, LowStockAlert = 10 },
                new Product { Name = "Kheer", SKU = "DST-004", Category = "Desserts", Unit = "Bowl", Price = 100, CostPrice = 40, Stock = 60, LowStockAlert = 8 },

                // Beverages
                new Product { Name = "Mango Lassi", SKU = "BEV-001", Category = "Beverages", Unit = "Glass", Price = 120, CostPrice = 45, Stock = 100, LowStockAlert = 10 },
                new Product { Name = "Sweet Lassi", SKU = "BEV-002", Category = "Beverages", Unit = "Glass", Price = 80, CostPrice = 30, Stock = 100, LowStockAlert = 10 },
                new Product { Name = "Masala Chai", SKU = "BEV-003", Category = "Beverages", Unit = "Cup", Price = 40, CostPrice = 12, Stock = 200, LowStockAlert = 20 },
                new Product { Name = "Fresh Lime Soda", SKU = "BEV-004", Category = "Beverages", Unit = "Glass", Price = 70, CostPrice = 20, Stock = 100, LowStockAlert = 10 },
                new Product { Name = "Cold Coffee", SKU = "BEV-005", Category = "Beverages", Unit = "Glass", Price = 130, CostPrice = 50, Stock = 80, LowStockAlert = 10 },
                new Product { Name = "Mineral Water 500ml", SKU = "BEV-006", Category = "Beverages", Unit = "Bottle", Price = 30, CostPrice = 15, Stock = 200, LowStockAlert = 30 },

                // Combo Meals
                new Product { Name = "Family Combo (4 pax)", SKU = "CMB-001", Category = "Combos", Unit = "Set", Price = 1200, CostPrice = 500, Stock = 50, LowStockAlert = 5 },
                new Product { Name = "Business Lunch Thali", SKU = "CMB-002", Category = "Combos", Unit = "Thali", Price = 350, CostPrice = 130, Stock = 60, LowStockAlert = 8 }
            );
        }

        if (!db.Customers.Any())
        {
            db.Customers.AddRange(
                new Customer { Name = "Walk-in Guest", Phone = "0000000000", Email = "" },
                new Customer { Name = "Rahul Sharma", Phone = "+91 98765 43210", Email = "rahul@gmail.com", Address = "12 Park Street" },
                new Customer { Name = "Priya Mehta", Phone = "+91 87654 32109", Email = "priya@outlook.com", Address = "45 MG Road" }
            );
        }

        db.SaveChanges();
    }
}
