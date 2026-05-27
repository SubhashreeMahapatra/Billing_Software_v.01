using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillFlow.API.Data;
using BillFlow.API.DTOs;
using BillFlow.API.Models;

namespace BillFlow.API.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _db;
    public InvoicesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var q = _db.Invoices.Include(i => i.Items).AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(i => i.Status == status);
        var total = await q.CountAsync();
        var invoices = await q.OrderByDescending(i => i.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { total, invoices = invoices.Select(Map) });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var inv = await _db.Invoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
        return inv == null ? NotFound() : Ok(Map(inv));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest req)
    {
        if (!req.Items.Any()) return BadRequest(new { message = "Invoice must have at least one item" });

        var invNum = $"INV-{DateTime.Now:yyyyMMdd}-{(await _db.Invoices.CountAsync() + 1):D4}";
        var subtotal = req.Items.Sum(i => i.Quantity * i.UnitPrice);
        var gstAmt = subtotal * (req.GSTPercent / 100);
        var discAmt = (subtotal + gstAmt) * (req.DiscountPercent / 100);
        var total = subtotal + gstAmt - discAmt;

        var inv = new Invoice
        {
            InvoiceNumber = invNum, CustomerId = req.CustomerId, CustomerName = req.CustomerName,
            CustomerPhone = req.CustomerPhone, Subtotal = subtotal, GSTPercent = req.GSTPercent,
            GSTAmount = gstAmt, DiscountPercent = req.DiscountPercent, DiscountAmount = discAmt,
            Total = total, Notes = req.Notes, PaymentMethod = req.PaymentMethod, Status = "pending"
        };

        foreach (var item in req.Items)
        {
            inv.Items.Add(new InvoiceItem
            {
                ProductId = item.ProductId, ProductName = item.ProductName, Category = item.Category,
                Quantity = item.Quantity, UnitPrice = item.UnitPrice, Total = item.Quantity * item.UnitPrice
            });
            if (item.ProductId.HasValue)
            {
                var p = await _db.Products.FindAsync(item.ProductId.Value);
                if (p != null) p.Stock = Math.Max(0, p.Stock - item.Quantity);
            }
        }

        _db.Invoices.Add(inv);
        await _db.SaveChangesAsync();
        var created = await _db.Invoices.Include(i => i.Items).FirstAsync(i => i.Id == inv.Id);
        return CreatedAtAction(nameof(Get), new { id = inv.Id }, Map(created));
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateInvoiceStatusRequest req)
    {
        var inv = await _db.Invoices.FindAsync(id);
        if (inv == null) return NotFound();
        inv.Status = req.Status;
        await _db.SaveChangesAsync();
        return Ok(new { id, status = req.Status });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var inv = await _db.Invoices.FindAsync(id);
        if (inv == null) return NotFound();
        inv.Status = "cancelled";
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static InvoiceDto Map(Invoice i) => new(
        i.Id, i.InvoiceNumber, i.CustomerId, i.CustomerName, i.CustomerPhone,
        i.InvoiceDate, i.Subtotal, i.GSTPercent, i.GSTAmount, i.DiscountPercent,
        i.DiscountAmount, i.Total, i.Status, i.Notes, i.PaymentMethod,
        i.Items.Select(ii => new InvoiceItemDto(ii.Id, ii.ProductId, ii.ProductName,
            ii.Category, ii.Quantity, ii.UnitPrice, ii.Total)).ToList()
    );
}
