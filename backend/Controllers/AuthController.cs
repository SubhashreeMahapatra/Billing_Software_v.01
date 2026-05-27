using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillFlow.API.Data;
using BillFlow.API.DTOs;
using BillFlow.API.Services;

namespace BillFlow.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuthService _auth;

    public AuthController(AppDbContext db, IAuthService auth)
    {
        _db = db;
        _auth = auth;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == req.Username && u.IsActive);
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid username or password" });

        var token = _auth.GenerateToken(user);
        return Ok(new LoginResponse(token, user.Username, user.Role, user.FullName));
    }
}
