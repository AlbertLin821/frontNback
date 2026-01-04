using BookSystem.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;

namespace BookSystem.Controllers
{
    [Route("api/bookmaintain")]
    [ApiController]
    public class BookMaintainController : ControllerBase
    {
        
        [HttpPost]
        [Route("addbook")]
        public IActionResult AddBook(Book book)
        {
            
            try
            {
                if (ModelState.IsValid)
                {
                    BookService bookService = new BookService();
                    bookService.AddBook(book);
                    return Ok(
                        new ApiResult<string>()
                        {
                            Data = string.Empty,
                            Status = true,
                            Message = string.Empty
                        });
                }
                else
                {
                    return BadRequest(ModelState);
                }

            }
            catch (Exception)
            {
                return Problem(); 
            }
        }
        [HttpPost()]
        [Route("querybook")]
        public IActionResult QueryBook([FromForm]BookQueryArg arg)
        {
            try
            {
                BookService bookService = new BookService();

                return Ok(bookService.QueryBook(arg));
            }
            catch (Exception)
            {
                return Problem();
            }
        }

        [HttpPost()]
        [Route("loadbook")]
        public IActionResult GetBookById([FromBody]int bookId)
        {
            try
            {
                BookService bookService = new BookService();
                Book book = bookService.GetBookById(bookId);
                ApiResult<Book> result = new ApiResult<Book>
                {
                    Data = book,
                    Status = true,
                    Message = string.Empty
                };

                return Ok(result);
            }
            catch (Exception)
            {

                return Problem();
            }
        }

        [HttpPost]
        [Route("updatebook")]
        public IActionResult UpdateBook(Book book)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    BookService bookService = new BookService();
                    bookService.UpdateBook(book);
                    return Ok(
                        new ApiResult<string>()
                        {
                            Data = string.Empty,
                            Status = true,
                            Message = string.Empty
                        });
                }
                else
                {
                    return BadRequest(ModelState);
                }
            }
            catch (Exception)
            {
                return Problem();
            }
        }



        [HttpPost()]
        [Route("deletebook")]
        public IActionResult DeleteBookById([FromBody] int bookId)
        {
            try
            {
                BookService bookService = new BookService();

                ApiResult<string> result = new ApiResult<string>
                {
                    Data = string.Empty,
                    Status = true,
                    Message = string.Empty
                };

                Book book = bookService.GetBookById(bookId);
                if (book != null && (book.BookStatusId == "B" || book.BookStatusId == "C"))
                {
                    result.Status = false;
                    result.Message = "該書已借出不可刪除";
                }
                else
                {
                    bookService.DeleteBookById(bookId);
                }

                return Ok(result);
            }
            catch (Exception)
            {
                return Problem();
            }
        }

        [HttpPost]
        [Route("booklendrecord")]
        public IActionResult GetBookLendRecord([FromBody] int bookId)
        {
            try
            {
                BookService bookService = new BookService();
                ApiResult<List<BookLendRecord>> result = new ApiResult<List<BookLendRecord>>
                {
                    Data = bookService.GetBookLendRecord(bookId),
                    Status = true,
                    Message = string.Empty
                };

                return Ok(result);
            }
            catch (Exception)
            {
                return Problem();
            }
        }
    }
}
