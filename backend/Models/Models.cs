using System.ComponentModel.DataAnnotations;

namespace BillFlow.API.Models;

public class User
{
    public int Id { get; set; }
    [Required] public string Username { get; set; } = "";
    [Required] public string PasswordHash { get; set; } = "";
    [Required] public string Role { get; set; } = "Cashier"; // Admin | Cashier
    public string FullName { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}

public class Product
{
    public int Id { get; set; }
    [Required] public string Name { get; set; } = "";
    public string SKU { get; set; } = "";
    [Required] public string Category { get; set; } = "";
    public string Unit { get; set; } = "Piece";
    public decimal Price { get; set; }
    public decimal CostPrice { get; set; }
    public int Stock { get; set; }
    public int LowStockAlert { get; set; } = 10;
    public string Description { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
}

public class Customer
{
    public int Id { get; set; }
    [Required] public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string Address { get; set; } = "";
    public string GSTIN { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}

public class Invoice
{
    public int Id { get; set; }
    [Required] public string InvoiceNumber { get; set; } = "";
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string CustomerName { get; set; } = "";
    public string CustomerPhone { get; set; } = "";
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public decimal Subtotal { get; set; }
    public decimal GSTPercent { get; set; } = 5;
    public decimal GSTAmount { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Total { get; set; }
    public string Status { get; set; } = "pending"; // pending | paid | cancelled
    public string Notes { get; set; } = "";
    public string PaymentMethod { get; set; } = "Cash";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}

public class InvoiceItem
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public int? ProductId { get; set; }
    public Product? Product { get; set; }
    public string ProductName { get; set; } = "";
    public string Category { get; set; } = "";
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
}
