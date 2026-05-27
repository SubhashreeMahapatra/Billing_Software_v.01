using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillFlow.API.Data;
using BillFlow.API.DTOs;
using BillFlow.API.Models;

namespace BillFlow.API.Controllers;

[ApiController]
[Route("api/products")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProductsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? category)
    {
        var q = _db.Products.Where(p => p.IsActive).AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(p => p.Name.Contains(search) || p.SKU.Contains(search));
        if (!string.IsNullOrEmpty(category))
            q = q.Where(p => p.Category == category);
        var products = await q.OrderBy(p => p.Category).ThenBy(p => p.Name).ToListAsync();
        return Ok(products.Select(Map));
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var cats = await _db.Products.Where(p => p.IsActive).Select(p => p.Category).Distinct().OrderBy(c => c).ToListAsync();
        return Ok(cats);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var p = await _db.Products.FindAsync(id);
        return p == null ? NotFound() : Ok(Map(p));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest req)
    {
        var p = new Product
        {
            Name = req.Name, SKU = req.SKU, Category = req.Category, Unit = req.Unit,
            Price = req.Price, CostPrice = req.CostPrice, Stock = req.Stock,
            LowStockAlert = req.LowStockAlert, Description = req.Description
        };
        _db.Products.Add(p);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = p.Id }, Map(p));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest req)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return NotFound();
        p.Name = req.Name; p.SKU = req.SKU; p.Category = req.Category; p.Unit = req.Unit;
        p.Price = req.Price; p.CostPrice = req.CostPrice; p.Stock = req.Stock;
        p.LowStockAlert = req.LowStockAlert; p.Description = req.Description; p.IsActive = req.IsActive;
        await _db.SaveChangesAsync();
        return Ok(Map(p));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return NotFound();
        p.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static ProductDto Map(Product p) => new(p.Id, p.Name, p.SKU, p.Category, p.Unit,
        p.Price, p.CostPrice, p.Stock, p.LowStockAlert, p.Description, p.IsActive);
}
