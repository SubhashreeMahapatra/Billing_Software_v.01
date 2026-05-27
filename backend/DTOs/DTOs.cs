namespace BillFlow.API.DTOs;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, string Username, string Role, string FullName);

public record ProductDto(int Id, string Name, string SKU, string Category, string Unit,
    decimal Price, decimal CostPrice, int Stock, int LowStockAlert, string Description, bool IsActive);

public record CreateProductRequest(string Name, string SKU, string Category, string Unit,
    decimal Price, decimal CostPrice, int Stock, int LowStockAlert, string Description);

public record UpdateProductRequest(string Name, string SKU, string Category, string Unit,
    decimal Price, decimal CostPrice, int Stock, int LowStockAlert, string Description, bool IsActive);

public record CustomerDto(int Id, string Name, string Phone, string Email, string Address, string GSTIN,
    int TotalOrders, decimal TotalSpent);

public record CreateCustomerRequest(string Name, string Phone, string Email, string Address, string GSTIN);

public record InvoiceItemRequest(int? ProductId, string ProductName, string Category, int Quantity, decimal UnitPrice);

public record CreateInvoiceRequest(
    int? CustomerId, string CustomerName, string CustomerPhone,
    List<InvoiceItemRequest> Items,
    decimal GSTPercent, decimal DiscountPercent, string Notes, string PaymentMethod
);

public record InvoiceItemDto(int Id, int? ProductId, string ProductName, string Category,
    int Quantity, decimal UnitPrice, decimal Total);

public record InvoiceDto(int Id, string InvoiceNumber, int? CustomerId, string CustomerName,
    string CustomerPhone, DateTime InvoiceDate, decimal Subtotal, decimal GSTPercent, decimal GSTAmount,
    decimal DiscountPercent, decimal DiscountAmount, decimal Total, string Status, string Notes,
    string PaymentMethod, List<InvoiceItemDto> Items);

public record UpdateInvoiceStatusRequest(string Status);

public record DashboardStats(
    decimal TotalRevenue, int TotalInvoices, int PaidInvoices, int PendingInvoices,
    List<CategorySales> TopCategories, List<RecentInvoice> RecentInvoices, List<LowStockItem> LowStockItems
);

public record CategorySales(string Category, decimal Revenue, int Units);
public record RecentInvoice(int Id, string InvoiceNumber, string CustomerName, decimal Total, string Status, DateTime Date);
public record LowStockItem(int Id, string Name, string Category, int Stock, int LowStockAlert);
