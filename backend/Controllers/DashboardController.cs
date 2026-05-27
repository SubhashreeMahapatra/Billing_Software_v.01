using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillFlow.API.Data;
using BillFlow.API.DTOs;

namespace BillFlow.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public DashboardController(AppDbContext db) => _db = db;

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var invoices = await _db.Invoices.Include(i => i.Items).ToListAsync();
        var paid = invoices.Where(i => i.Status == "paid").ToList();
        var pending = invoices.Where(i => i.Status == "pending").ToList();

        var catSales = invoices
            .Where(i => i.Status != "cancelled")
            .SelectMany(i => i.Items)
            .GroupBy(ii => ii.Category)
            .Select(g => new CategorySales(g.Key, g.Sum(ii => ii.Total), g.Sum(ii => ii.Quantity)))
            .OrderByDescending(c => c.Revenue)
            .Take(6)
            .ToList();

        var recent = invoices
            .OrderByDescending(i => i.CreatedAt)
            .Take(8)
            .Select(i => new RecentInvoice(i.Id, i.InvoiceNumber, i.CustomerName, i.Total, i.Status, i.CreatedAt))
            .ToList();

        var lowStock = await _db.Products
            .Where(p => p.IsActive && p.Stock <= p.LowStockAlert)
            .OrderBy(p => p.Stock)
            .Select(p => new LowStockItem(p.Id, p.Name, p.Category, p.Stock, p.LowStockAlert))
            .ToListAsync();

        return Ok(new DashboardStats(
            paid.Sum(i => i.Total),
            invoices.Count,
            paid.Count,
            pending.Count,
            catSales,
            recent,
            lowStock
        ));
    }

    [HttpGet("report")]
    public async Task<IActionResult> GetReport([FromQuery] string period = "month")
    {
        var from = period switch
        {
            "week" => DateTime.UtcNow.AddDays(-7),
            "year" => DateTime.UtcNow.AddYears(-1),
            _ => DateTime.UtcNow.AddMonths(-1)
        };

        var invoices = await _db.Invoices
            .Include(i => i.Items)
            .Where(i => i.CreatedAt >= from)
            .ToListAsync();

        var dailyRevenue = invoices
            .Where(i => i.Status == "paid")
            .GroupBy(i => i.CreatedAt.Date)
            .Select(g => new { date = g.Key.ToString("yyyy-MM-dd"), revenue = g.Sum(i => i.Total) })
            .OrderBy(x => x.date)
            .ToList();

        var topProducts = invoices
            .Where(i => i.Status != "cancelled")
            .SelectMany(i => i.Items)
            .GroupBy(ii => ii.ProductName)
            .Select(g => new { name = g.Key, qty = g.Sum(ii => ii.Quantity), revenue = g.Sum(ii => ii.Total) })
            .OrderByDescending(x => x.revenue)
            .Take(10)
            .ToList();

        return Ok(new { dailyRevenue, topProducts, period });
    }
}
