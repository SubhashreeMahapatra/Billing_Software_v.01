using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillFlow.API.Data;
using BillFlow.API.DTOs;
using BillFlow.API.Models;

namespace BillFlow.API.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    public CustomersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
    {
        var q = _db.Customers.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(c => c.Name.Contains(search) || c.Phone.Contains(search) || c.Email.Contains(search));

        var customers = await q.OrderBy(c => c.Name).ToListAsync();
        var result = new List<CustomerDto>();
        foreach (var c in customers)
        {
            var orders = await _db.Invoices.Where(i => i.CustomerId == c.Id).ToListAsync();
            result.Add(new CustomerDto(c.Id, c.Name, c.Phone, c.Email, c.Address, c.GSTIN,
                orders.Count, orders.Sum(o => o.Total)));
        }
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return NotFound();
        var orders = await _db.Invoices.Where(i => i.CustomerId == id).ToListAsync();
        return Ok(new CustomerDto(c.Id, c.Name, c.Phone, c.Email, c.Address, c.GSTIN,
            orders.Count, orders.Sum(o => o.Total)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest req)
    {
        var c = new Customer
        {
            Name = req.Name, Phone = req.Phone, Email = req.Email,
            Address = req.Address, GSTIN = req.GSTIN
        };
        _db.Customers.Add(c);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = c.Id },
            new CustomerDto(c.Id, c.Name, c.Phone, c.Email, c.Address, c.GSTIN, 0, 0));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateCustomerRequest req)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return NotFound();
        c.Name = req.Name; c.Phone = req.Phone; c.Email = req.Email;
        c.Address = req.Address; c.GSTIN = req.GSTIN;
        await _db.SaveChangesAsync();
        return Ok(new CustomerDto(c.Id, c.Name, c.Phone, c.Email, c.Address, c.GSTIN, 0, 0));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return NotFound();
        _db.Customers.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
